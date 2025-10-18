import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { NetworkDetection } from '../../utils/serverDetection';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatTimeAgo } from '../../utils/timeFormat';
import { router } from 'expo-router';

// Category mapping
const CATEGORY_MAP: { [key: string]: string } = {
  'Travel Tips': 'travel-tips',
  'Safety': 'safety',
  'Transportation': 'transportation',
  'Food & Dining': 'food-dining',
  'Accommodation': 'accommodation',
  'Activities': 'activities',
  'Culture': 'culture',
  'Budget': 'budget',
};

const CATEGORIES = [
  'Travel Tips',
  'Safety',
  'Transportation',
  'Food & Dining',
  'Accommodation',
  'Activities',
  'Culture',
  'Budget',
];

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
    isAnonymous: boolean;
  };
  views: number;
  votes: {
    upvotes: number;
    downvotes: number;
    score: number;
  };
  answersCount: number;
  isFeatured: boolean;
  isAnswered: boolean;
  bestAnswerId: string | null;
  createdAt: string;
  userVote?: 'up' | 'down' | null;
}

interface QuestionCardProps {
  question: Question;
  onVote: (questionId: string, voteType: 'up' | 'down') => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onVote }) => {
  const handleVote = (voteType: 'up' | 'down') => {
    onVote(question._id, voteType);
  };

  const handleQuestionPress = () => {
    router.push(`/community/question-detail?id=${question._id}`);
  };

  // Map category to display name
  const getCategoryDisplay = (category: string) => {
    const entry = Object.entries(CATEGORY_MAP).find(([_, value]) => value === category);
    return entry ? entry[0] : category;
  };

  return (
    <TouchableOpacity style={styles.questionCard} onPress={handleQuestionPress}>
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <View style={styles.questionMeta}>
          {question.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color={Colors.white} />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          {question.isAnswered && (
            <View style={styles.answeredBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.white} />
              <Text style={styles.answeredText}>Answered</Text>
            </View>
          )}
        </View>
        <Text style={styles.categoryText}>{getCategoryDisplay(question.category)}</Text>
      </View>

      {/* Question Title */}
      <Text style={styles.questionTitle}>{question.title}</Text>
      
      {/* Question Content Preview */}
      <Text style={styles.questionContent} numberOfLines={2}>
        {question.content}
      </Text>

      {/* Tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsContainer}
      >
        {question.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Question Footer */}
      <View style={styles.questionFooter}>
        <View style={styles.questionStats}>
          <View style={styles.votingContainer}>
            <TouchableOpacity
              style={[
                styles.voteButton,
                question.userVote === 'up' && styles.voteButtonActive
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleVote('up');
              }}
            >
              <Ionicons
                name="chevron-up"
                size={16}
                color={question.userVote === 'up' ? Colors.white : Colors.secondary500}
              />
            </TouchableOpacity>
            <Text style={styles.voteCount}>{question.votes.score}</Text>
            <TouchableOpacity
              style={[
                styles.voteButton,
                question.userVote === 'down' && styles.voteButtonDown
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleVote('down');
              }}
            >
              <Ionicons
                name="chevron-down"
                size={16}
                color={question.userVote === 'down' ? Colors.white : Colors.secondary500}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.questionMetrics}>
            <View style={styles.metric}>
              <Ionicons name="chatbubble-outline" size={14} color={Colors.secondary500} />
              <Text style={styles.metricText}>{question.answersCount}</Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="eye-outline" size={14} color={Colors.secondary500} />
              <Text style={styles.metricText}>{question.views}</Text>
            </View>
          </View>
        </View>

        <View style={styles.askedInfo}>
          <Text style={styles.askedBy}>
            asked by {question.askedBy.username}
          </Text>
          <Text style={styles.askedTime}>{formatTimeAgo(question.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function AskQuestionScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch questions from API
  const fetchQuestions = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Get user ID from stored userData
      const userDataStr = await AsyncStorage.getItem('userData');
      let userIdStored: string | null = null;
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userIdStored = userData.id;
        setUserId(userIdStored);
      }

      const baseURL = await NetworkDetection.detectServer();
      
      // Build query params
      const params = new URLSearchParams({
        sort: 'recent',
        limit: '50',
      });
      
      if (selectedCategory !== 'all') {
        params.append('category', CATEGORY_MAP[selectedCategory]);
      }
      
      if (userIdStored) {
        params.append('userId', userIdStored);
      }

      const apiURL = `${baseURL}/api/community/questions?${params.toString()}`;
      console.log('📥 Fetching questions from:', apiURL);

      const response = await fetch(apiURL, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Fetched ${data.data.questions.length} questions`);
        setQuestions(data.data.questions);
      } else {
        console.error('❌ Failed to fetch questions:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching questions:', error);
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch on mount and when category changes
  useEffect(() => {
    fetchQuestions();
  }, [selectedCategory]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchQuestions(false);
  };

  // Handle vote
  const handleVote = async (questionId: string, voteType: 'up' | 'down') => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Error', 'Please login to vote');
        return;
      }

      const baseURL = await NetworkDetection.detectServer();
      const response = await fetch(`${baseURL}/api/community/questions/${questionId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setQuestions(prev => prev.map(q => 
          q._id === questionId
            ? { ...q, votes: data.data.votes, userVote: data.data.userVote }
            : q
        ));
      } else {
        Alert.alert('Error', data.message || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote. Please try again.');
    }
  };

  const handleAskQuestion = () => {
    router.push('/community/ask-question-form');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Q&A Community</Text>
        <TouchableOpacity>
          <Ionicons name="search-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {/* Ask Question Button */}
      <View style={styles.askQuestionContainer}>
        <TouchableOpacity style={styles.askQuestionButton} onPress={handleAskQuestion}>
          <Ionicons name="add-circle" size={24} color={Colors.primary600} />
          <View style={styles.askQuestionContent}>
            <Text style={styles.askQuestionTitle}>Ask a Question</Text>
            <Text style={styles.askQuestionSubtitle}>Get help from fellow travelers</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.secondary400} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryTab,
            selectedCategory === 'all' && styles.activeCategoryTab
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryTabText,
            selectedCategory === 'all' && styles.activeCategoryTabText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory === category && styles.activeCategoryTabText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Questions List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="help-circle-outline" size={64} color={Colors.secondary200} />
          <Text style={styles.emptyTitle}>No Questions Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to ask a question in this category!
          </Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <QuestionCard question={item} onVote={handleVote} />}
          contentContainerStyle={styles.questionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary600]}
            />
          }
        />
      )}
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
  askQuestionContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  askQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
    borderRadius: 12,
    padding: 16,
  },
  askQuestionContent: {
    flex: 1,
    marginLeft: 12,
  },
  askQuestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary600,
    marginBottom: 2,
  },
  askQuestionSubtitle: {
    fontSize: 12,
    color: Colors.primary500,
  },
  categoryFilter: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
    maxHeight: 60,
    height: 'auto'
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    //minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Colors.light100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    height: 32, 
  },
  activeCategoryTab: {
    backgroundColor: Colors.primary600,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary500,
  },
  activeCategoryTabText: {
    color: Colors.white,
  },
  questionsList: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    marginRight: 6,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 2,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  answeredText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 2,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.primary600,
    fontWeight: '500',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 6,
    lineHeight: 22,
  },
  questionContent: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 18,
    marginBottom: 12,
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.light200,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  bestAnswerPreview: {
    backgroundColor: Colors.success + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  bestAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bestAnswerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 4,
    marginRight: 4,
  },
  bestAnswerContent: {
    fontSize: 12,
    color: Colors.black,
    lineHeight: 16,
    marginBottom: 4,
  },
  bestAnswerAuthor: {
    fontSize: 10,
    color: Colors.secondary500,
    fontStyle: 'italic',
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
  },
  questionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  votingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  voteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black,
    marginHorizontal: 6,
    minWidth: 20,
    textAlign: 'center',
  },
  questionMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metricText: {
    fontSize: 12,
    color: Colors.secondary500,
    marginLeft: 2,
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
    fontSize: 10,
    color: Colors.secondary500,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.secondary500,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
