import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { NetworkDetection } from '../../utils/serverDetection';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatTimeAgo } from '../../utils/timeFormat';

// Category display mapping
const CATEGORY_MAP: { [key: string]: string } = {
  'travel-tips': 'Travel Tips',
  'accommodation': 'Accommodation',
  'transportation': 'Transportation',
  'activities': 'Activities',
  'food-dining': 'Food & Dining',
  'culture-customs': 'Culture & Customs',
  'safety-health': 'Safety & Health',
  'budget-planning': 'Budget & Planning',
};

interface Question {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  askedBy: {
    userId: string;
    username: string;
    reputation: number;
  };
  votes: {
    upvotes: number;
    downvotes: number;
    score: number;
  };
  views: {
    total: number;
  };
  answersCount: number;
  isFeatured: boolean;
  isAnswered: boolean;
  bestAnswerId?: string;
  createdAt: string;
  userVote?: 'up' | 'down' | null;
}

interface Answer {
  _id: string;
  content: string;
  answeredBy: {
    userId: string;
    username: string;
    reputation: number;
    verified: boolean;
  };
  votes: {
    upvotes: number;
    downvotes: number;
    score: number;
  };
  helpfulCount: number;
  isBestAnswer: boolean;
  createdAt: string;
  userVote?: 'up' | 'down' | null;
  isMarkedHelpful?: boolean;
}

interface AnswerCardProps {
  answer: Answer;
  onVote: (answerId: string, voteType: 'up' | 'down') => void;
  onMarkHelpful: (answerId: string) => void;
  userVotes: { [key: string]: 'up' | 'down' | null };
  userHelpful: { [key: string]: boolean };
}

const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  onVote,
  onMarkHelpful,
  userVotes,
  userHelpful,
}) => {
  const userVote = userVotes[answer._id];
  const isHelpful = userHelpful[answer._id];

  return (
    <View style={[styles.answerCard, answer.isBestAnswer && styles.bestAnswerCard]}>
      {answer.isBestAnswer && (
        <View style={styles.bestAnswerBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.bestAnswerText}>Best Answer</Text>
          {answer.answeredBy.verified && (
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary600} />
          )}
        </View>
      )}

      <View style={styles.answerHeader}>
        <View style={styles.answerAuthor}>
          <Text style={styles.authorName}>{answer.answeredBy.username}</Text>
          {answer.answeredBy.verified && (
            <Ionicons name="shield-checkmark" size={12} color={Colors.primary600} />
          )}
          <Text style={styles.authorReputation}>• {answer.answeredBy.reputation} pts</Text>
        </View>
        <Text style={styles.answerTime}>{formatTimeAgo(answer.createdAt)}</Text>
      </View>

      <Text style={styles.answerContent}>{answer.content}</Text>

      <View style={styles.answerFooter}>
        <View style={styles.answerActions}>
          <View style={styles.votingContainer}>
            <TouchableOpacity
              style={[styles.voteButton, userVote === 'up' && styles.voteButtonActive]}
              onPress={() => onVote(answer._id, 'up')}
            >
              <Ionicons
                name="chevron-up"
                size={16}
                color={userVote === 'up' ? Colors.white : Colors.secondary500}
              />
            </TouchableOpacity>
            <Text style={styles.voteCount}>{answer.votes.score}</Text>
            <TouchableOpacity
              style={[styles.voteButton, userVote === 'down' && styles.voteButtonDown]}
              onPress={() => onVote(answer._id, 'down')}
            >
              <Ionicons
                name="chevron-down"
                size={16}
                color={userVote === 'down' ? Colors.white : Colors.secondary500}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.helpfulButton, isHelpful && styles.helpfulButtonActive]}
            onPress={() => onMarkHelpful(answer._id)}
          >
            <Ionicons
              name="heart"
              size={14}
              color={isHelpful ? Colors.white : Colors.secondary500}
            />
            <Text style={[styles.helpfulText, isHelpful && styles.helpfulTextActive]}>
              Helpful ({answer.helpfulCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const getCategoryDisplay = (category: string): string => {
  return CATEGORY_MAP[category] || category;
};

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams() as { id: string };
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [answerVotes, setAnswerVotes] = useState<{ [key: string]: 'up' | 'down' | null }>({});
  const [answerHelpful, setAnswerHelpful] = useState<{ [key: string]: boolean }>({});
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestionDetails();
  }, [id]);

  const fetchQuestionDetails = async () => {
    try {
      setIsLoading(true);
      
      // Get user ID from stored userData
      const userDataStr = await AsyncStorage.getItem('userData');
      let storedUserId: string | null = null;
      
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        storedUserId = userData.id;
        console.log('👤 User ID from userData:', storedUserId);
      }
      
      setUserId(storedUserId);
      const token = await AsyncStorage.getItem('accessToken');

      // Detect server URL
      console.log('🔍 🌐 Smart WiFi-adaptive server detection starting...');
      const baseURL = await NetworkDetection.detectServer();
      console.log('📱 Using Expo host server:', baseURL);

      // Fetch question with userId for vote status
      const questionUrl = `${baseURL}/api/community/questions/${id}${storedUserId ? `?userId=${storedUserId}` : ''}`;
      console.log('📥 Fetching question from:', questionUrl);

      const questionResponse = await fetch(questionUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!questionResponse.ok) {
        throw new Error('Failed to fetch question');
      }

      const questionData = await questionResponse.json();
      console.log('✅ Fetched question:', questionData.data.question.title);
      
      setQuestion(questionData.data.question);
      setUserVote(questionData.data.question.userVote || null);

      // Fetch answers
      const answersUrl = `${baseURL}/api/community/questions/${id}/answers${storedUserId ? `?userId=${storedUserId}` : ''}`;
      console.log('📥 Fetching answers from:', answersUrl);

      const answersResponse = await fetch(answersUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (answersResponse.ok) {
        const answersData = await answersResponse.json();
        console.log('✅ Fetched', answersData.data.answers.length, 'answers');
        setAnswers(answersData.data.answers);
        
        // Set initial vote and helpful states
        const votes: { [key: string]: 'up' | 'down' | null } = {};
        const helpful: { [key: string]: boolean } = {};
        answersData.data.answers.forEach((answer: Answer) => {
          votes[answer._id] = answer.userVote || null;
          helpful[answer._id] = answer.isMarkedHelpful || false;
        });
        setAnswerVotes(votes);
        setAnswerHelpful(helpful);
      }
    } catch (error) {
      console.error('❌ Error fetching question:', error);
      Alert.alert('Error', 'Failed to load question details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionVote = async (voteType: 'up' | 'down') => {
    if (!question || !userId) {
      Alert.alert('Login Required', 'Please log in to vote');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const baseURL = await NetworkDetection.detectServer();

      const response = await fetch(`${baseURL}/api/community/questions/${question._id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      const data = await response.json();
      console.log('✅ Vote updated:', data);

      // Update local state
      setQuestion(prev => prev ? { ...prev, votes: data.data.votes } : null);
      setUserVote(data.data.userVote);
    } catch (error) {
      console.error('❌ Error voting:', error);
      Alert.alert('Error', 'Failed to submit vote');
    }
  };

  const handleAnswerVote = async (answerId: string, voteType: 'up' | 'down') => {
    if (!userId) {
      Alert.alert('Login Required', 'Please log in to vote');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const baseURL = await NetworkDetection.detectServer();

      console.log('🗳️ Voting on answer:', answerId, 'Type:', voteType);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${baseURL}/api/community/answers/${answerId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ voteType }),
      });

      const data = await response.json();
      console.log('📡 Response status:', response.status);
      console.log('📡 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to vote');
      }

      console.log('✅ Answer vote updated:', data);

      // Update local state
      setAnswers(prev => 
        prev.map(ans => 
          ans._id === answerId 
            ? { ...ans, votes: data.data.votes }
            : ans
        )
      );
      setAnswerVotes(prev => ({
        ...prev,
        [answerId]: data.data.userVote
      }));
    } catch (error: any) {
      console.error('❌ Error voting on answer:', error);
      Alert.alert('Error', error.message || 'Failed to submit vote');
    }
  };

  const handleMarkHelpful = async (answerId: string) => {
    if (!userId) {
      Alert.alert('Login Required', 'Please log in to mark as helpful');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const baseURL = await NetworkDetection.detectServer();

      const response = await fetch(`${baseURL}/api/community/answers/${answerId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark helpful');
      }

      const data = await response.json();
      console.log('✅ Helpful status updated:', data);

      // Update local state
      setAnswers(prev =>
        prev.map(ans =>
          ans._id === answerId
            ? { ...ans, helpfulCount: data.data.helpfulCount }
            : ans
        )
      );
      setAnswerHelpful(prev => ({
        ...prev,
        [answerId]: data.data.isMarkedHelpful
      }));
    } catch (error) {
      console.error('❌ Error marking helpful:', error);
      Alert.alert('Error', 'Failed to update helpful status');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) {
      Alert.alert('Error', 'Please enter your answer');
      return;
    }

    if (!userId) {
      Alert.alert('Login Required', 'Please log in to post an answer');
      return;
    }

    if (!question) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const baseURL = await NetworkDetection.detectServer();

      console.log('📤 Submitting answer to:', `${baseURL}/api/community/questions/${question._id}/answers`);

      const response = await fetch(`${baseURL}/api/community/questions/${question._id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: newAnswer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit answer');
      }

      const data = await response.json();
      console.log('📥 Response:', data);
      
      Alert.alert(
        'Answer Submitted!',
        'Your answer has been posted successfully.',
        [{ 
          text: 'OK', 
          onPress: () => {
            setNewAnswer('');
            fetchQuestionDetails(); // Refresh to show new answer
          }
        }]
      );
    } catch (error: any) {
      console.error('❌ Error submitting answer:', error);
      Alert.alert('Error', error.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Question</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Question</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.secondary200} />
          <Text style={styles.emptyTitle}>Question Not Found</Text>
          <Text style={styles.emptyText}>This question may have been deleted or doesn't exist.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question</Text>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Card */}
          <View style={styles.questionCard}>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={styles.questionMeta}>
                {question.isFeatured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={12} color={Colors.white} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                )}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{getCategoryDisplay(question.category)}</Text>
                </View>
              </View>
              <Text style={styles.questionStats}>
                {question.views.total} views • {question.answersCount} answers
              </Text>
            </View>

            {/* Question Title */}
            <Text style={styles.questionTitle}>{question.title}</Text>

            {/* Question Content */}
            <Text style={styles.questionContent}>{question.content}</Text>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {question.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Question Footer */}
            <View style={styles.questionFooter}>
              <View style={styles.questionActions}>
                <View style={styles.votingContainer}>
                  <TouchableOpacity
                    style={[styles.voteButton, userVote === 'up' && styles.voteButtonActive]}
                    onPress={() => handleQuestionVote('up')}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={16}
                      color={userVote === 'up' ? Colors.white : Colors.secondary500}
                    />
                  </TouchableOpacity>
                  <Text style={styles.voteCount}>{question.votes.score}</Text>
                  <TouchableOpacity
                    style={[styles.voteButton, userVote === 'down' && styles.voteButtonDown]}
                    onPress={() => handleQuestionVote('down')}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={userVote === 'down' ? Colors.white : Colors.secondary500}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.askedInfo}>
                <Text style={styles.askedBy}>asked by {question.askedBy.username}</Text>
                <Text style={styles.askedTime}>{formatTimeAgo(question.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* Answers Section */}
          <View style={styles.answersSection}>
            <Text style={styles.answersTitle}>
              {question.answersCount} Answer{question.answersCount !== 1 ? 's' : ''}
            </Text>

            {answers.map((answer: Answer) => (
              <AnswerCard
                key={answer._id}
                answer={answer}
                onVote={handleAnswerVote}
                onMarkHelpful={handleMarkHelpful}
                userVotes={answerVotes}
                userHelpful={answerHelpful}
              />
            ))}
          </View>

          {/* Answer Form */}
          <View style={styles.answerForm}>
            <Text style={styles.answerFormTitle}>Your Answer</Text>
            <TextInput
              style={styles.answerInput}
              placeholder="Share your knowledge and help other travelers..."
              placeholderTextColor={Colors.secondary400}
              value={newAnswer}
              onChangeText={setNewAnswer}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Post Answer'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.secondary500,
    textAlign: 'center',
    lineHeight: 20,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 2,
  },
  categoryBadge: {
    backgroundColor: Colors.primary100,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    color: Colors.primary600,
    fontWeight: '600',
  },
  questionStats: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
    lineHeight: 28,
  },
  questionContent: {
    fontSize: 16,
    color: Colors.secondary600,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: Colors.light200,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  votingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonActive: {
    backgroundColor: Colors.primary600,
  },
  voteButtonDown: {
    backgroundColor: Colors.error,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  askedInfo: {
    alignItems: 'flex-end',
  },
  askedBy: {
    fontSize: 12,
    color: Colors.secondary600,
    marginBottom: 2,
  },
  askedTime: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  answersSection: {
    marginBottom: 20,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 16,
  },
  answerCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bestAnswerCard: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: Colors.success + '05',
  },
  bestAnswerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bestAnswerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 4,
    marginRight: 4,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  answerAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginRight: 4,
  },
  authorReputation: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  answerTime: {
    fontSize: 12,
    color: Colors.secondary500,
  },
  answerContent: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 22,
    marginBottom: 16,
  },
  answerFooter: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  answerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light100,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  helpfulButtonActive: {
    backgroundColor: Colors.error,
  },
  helpfulText: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 4,
  },
  helpfulTextActive: {
    color: Colors.white,
  },
  answerForm: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  answerFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 12,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: Colors.light200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.black,
    backgroundColor: Colors.white,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: Colors.primary600,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.secondary400,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomSpacing: {
    height: 40,
  },
});
