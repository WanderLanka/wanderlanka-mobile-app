import {
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
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatTimeAgo } from '../../utils/timeFormat';

// Mock detailed question data with answers
const MOCK_QUESTION_DETAIL = {
  id: 'q1',
  question: 'Best time to visit Sigiriya Rock?',
  content: 'I\'m planning to visit Sigiriya and wondering what\'s the best time of day to avoid crowds and get the best views. Also, any tips for the climb? I\'m particularly interested in photography opportunities and would love to know about the lighting conditions throughout the day.',
  askedBy: {
    name: 'Tourist_2024',
    avatar: null,
    reputation: 120,
  },
  askedDate: '2024-07-08T10:00:00Z',
  answers: 5,
  views: 234,
  votes: 12,
  category: 'Travel Tips',
  tags: ['sigiriya', 'timing', 'crowds', 'photography'],
  featured: true,
  answered: true,
  bestAnswerId: 'a1',
  allAnswers: [
    {
      id: 'a1',
      content: 'Early morning (6:30-7:00 AM) is absolutely the best time! Here\'s why:\n\n1. **Fewer crowds** - Most tourists arrive later in the day\n2. **Cooler weather** - Sri Lanka can get quite hot by midday\n3. **Better lighting** - Perfect for photography with soft morning light\n4. **Wildlife activity** - You\'ll see more birds and monkeys\n\n**Tips for the climb:**\n- Bring at least 2 liters of water per person\n- Wear comfortable hiking shoes with good grip\n- Take breaks at the various levels - don\'t rush\n- The frescoes are about halfway up - definitely worth the stop\n\nThe view from the top is absolutely worth every step! I\'ve been there 5 times and morning visits are always the most rewarding.',
      answeredBy: {
        name: 'LocalGuide_Pradeep',
        avatar: null,
        reputation: 450,
        verified: true,
      },
      answeredDate: '2024-07-08T11:30:00Z',
      votes: 23,
      isBestAnswer: true,
      helpful: 15,
    },
    {
      id: 'a2',
      content: 'I visited last month and can confirm the early morning advice! Started the climb at 6:30 AM and reached the top by 8:00 AM. The sunrise views were incredible.\n\nAdditional tips:\n- Book tickets online in advance to avoid queues\n- Bring a hat and sunscreen even for morning visits\n- The steps can be steep - take your time\n- There are restrooms at the base and halfway point',
      answeredBy: {
        name: 'TravelEnthusiast_Sarah',
        avatar: null,
        reputation: 89,
        verified: false,
      },
      answeredDate: '2024-07-08T14:20:00Z',
      votes: 8,
      isBestAnswer: false,
      helpful: 6,
    },
    {
      id: 'a3',
      content: 'For photography specifically, the golden hour (6:30-7:30 AM) gives you the most dramatic lighting. The rock formation looks amazing with the morning mist.\n\nI\'d also recommend bringing:\n- Wide-angle lens for landscape shots\n- Telephoto for wildlife\n- Extra batteries (humidity drains them faster)\n\nAvoid afternoon visits if possible - too harsh lighting and very crowded.',
      answeredBy: {
        name: 'PhotoExplorer_Mike',
        avatar: null,
        reputation: 156,
        verified: false,
      },
      answeredDate: '2024-07-08T16:45:00Z',
      votes: 12,
      isBestAnswer: false,
      helpful: 9,
    },
  ],
};

interface Answer {
  id: string;
  content: string;
  answeredBy: {
    name: string;
    avatar: string | null;
    reputation: number;
    verified: boolean;
  };
  answeredDate: string;
  votes: number;
  isBestAnswer: boolean;
  helpful: number;
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
  const userVote = userVotes[answer.id];
  const isHelpful = userHelpful[answer.id];

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
          <Text style={styles.authorName}>{answer.answeredBy.name}</Text>
          {answer.answeredBy.verified && (
            <Ionicons name="shield-checkmark" size={12} color={Colors.primary600} />
          )}
          <Text style={styles.authorReputation}>• {answer.answeredBy.reputation} pts</Text>
        </View>
        <Text style={styles.answerTime}>{formatTimeAgo(answer.answeredDate)}</Text>
      </View>

      <Text style={styles.answerContent}>{answer.content}</Text>

      <View style={styles.answerFooter}>
        <View style={styles.answerActions}>
          <View style={styles.votingContainer}>
            <TouchableOpacity
              style={[styles.voteButton, userVote === 'up' && styles.voteButtonActive]}
              onPress={() => onVote(answer.id, 'up')}
            >
              <Ionicons
                name="chevron-up"
                size={16}
                color={userVote === 'up' ? Colors.white : Colors.secondary500}
              />
            </TouchableOpacity>
            <Text style={styles.voteCount}>{answer.votes}</Text>
            <TouchableOpacity
              style={[styles.voteButton, userVote === 'down' && styles.voteButtonDown]}
              onPress={() => onVote(answer.id, 'down')}
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
            onPress={() => onMarkHelpful(answer.id)}
          >
            <Ionicons
              name="heart"
              size={14}
              color={isHelpful ? Colors.white : Colors.secondary500}
            />
            <Text style={[styles.helpfulText, isHelpful && styles.helpfulTextActive]}>
              Helpful ({answer.helpful})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [question] = useState(MOCK_QUESTION_DETAIL);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [questionVotes, setQuestionVotes] = useState(question.votes);
  const [answerVotes, setAnswerVotes] = useState<{ [key: string]: 'up' | 'down' | null }>({});
  const [answerHelpful, setAnswerHelpful] = useState<{ [key: string]: boolean }>({});
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuestionVote = (voteType: 'up' | 'down') => {
    if (userVote === voteType) {
      setQuestionVotes(questionVotes - (voteType === 'up' ? 1 : -1));
      setUserVote(null);
    } else {
      if (userVote) {
        setQuestionVotes(questionVotes - (userVote === 'up' ? 1 : -1));
      }
      setQuestionVotes(questionVotes + (voteType === 'up' ? 1 : -1));
      setUserVote(voteType);
    }
  };

  const handleAnswerVote = (answerId: string, voteType: 'up' | 'down') => {
    const currentVote = answerVotes[answerId];
    const newVotes = { ...answerVotes };
    
    if (currentVote === voteType) {
      newVotes[answerId] = null;
    } else {
      newVotes[answerId] = voteType;
    }
    
    setAnswerVotes(newVotes);
  };

  const handleMarkHelpful = (answerId: string) => {
    setAnswerHelpful(prev => ({
      ...prev,
      [answerId]: !prev[answerId]
    }));
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) {
      Alert.alert('Error', 'Please enter your answer');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Answer Submitted!',
        'Your answer has been posted and will be visible to other users.',
        [{ text: 'OK', onPress: () => setNewAnswer('') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {question.featured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={12} color={Colors.white} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                )}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{question.category}</Text>
                </View>
              </View>
              <Text style={styles.questionStats}>
                {question.views} views • {question.answers} answers
              </Text>
            </View>

            {/* Question Title */}
            <Text style={styles.questionTitle}>{question.question}</Text>

            {/* Question Content */}
            <Text style={styles.questionContent}>{question.content}</Text>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {question.tags.map((tag, index) => (
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
                  <Text style={styles.voteCount}>{questionVotes}</Text>
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
                <Text style={styles.askedBy}>asked by {question.askedBy.name}</Text>
                <Text style={styles.askedTime}>{formatTimeAgo(question.askedDate)}</Text>
              </View>
            </View>
          </View>

          {/* Answers Section */}
          <View style={styles.answersSection}>
            <Text style={styles.answersTitle}>
              {question.answers} Answer{question.answers !== 1 ? 's' : ''}
            </Text>

            {question.allAnswers.map((answer) => (
              <AnswerCard
                key={answer.id}
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
