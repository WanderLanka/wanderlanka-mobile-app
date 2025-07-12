import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatTimeAgo } from '../../utils/timeFormat';
import { router } from 'expo-router';

// Mock Q&A data - easily replaceable with backend API
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    question: 'Best time to visit Sigiriya Rock?',
    content: 'I\'m planning to visit Sigiriya and wondering what\'s the best time of day to avoid crowds and get the best views. Also, any tips for the climb?',
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
    tags: ['sigiriya', 'timing', 'crowds'],
    featured: true,
    answered: true,
    bestAnswer: {
      id: 'a1',
      content: 'Early morning (6:30-7:00 AM) is the best time! Less crowded and cooler weather. Bring water, wear comfortable shoes, and take breaks. The view is absolutely worth it!',
      answeredBy: 'LocalGuide_Pradeep',
      votes: 23,
      verified: true,
    },
  },
  {
    id: 'q2',
    question: 'Safe areas to stay in Colombo for solo female travelers?',
    content: 'I\'m a solo female traveler visiting Colombo next month. Looking for recommendations on safe neighborhoods and hotels. Any specific areas to avoid?',
    askedBy: {
      name: 'SoloTraveler',
      avatar: null,
      reputation: 89,
    },
    askedDate: '2024-07-08T08:30:00Z',
    answers: 12,
    views: 456,
    votes: 18,
    category: 'Safety',
    tags: ['colombo', 'safety', 'solo-travel', 'accommodation'],
    featured: false,
    answered: true,
  },
  {
    id: 'q3',
    question: 'How to get from Kandy to Ella by train?',
    content: 'Planning the scenic train ride from Kandy to Ella. How do I book tickets? Should I reserve in advance? What class is recommended for the best views?',
    askedBy: {
      name: 'TrainEnthusiast',
      avatar: null,
      reputation: 156,
    },
    askedDate: '2024-07-07T16:45:00Z',
    answers: 8,
    views: 189,
    votes: 15,
    category: 'Transportation',
    tags: ['kandy', 'ella', 'train', 'scenic-route'],
    featured: false,
    answered: true,
  },
  {
    id: 'q4',
    question: 'Vegetarian food options in Galle?',
    content: 'Are there good vegetarian restaurants in Galle? Looking for both local Sri Lankan vegetarian dishes and international options.',
    askedBy: {
      name: 'VeggieTraveler',
      avatar: null,
      reputation: 67,
    },
    askedDate: '2024-07-07T14:20:00Z',
    answers: 3,
    views: 98,
    votes: 7,
    category: 'Food & Dining',
    tags: ['galle', 'vegetarian', 'restaurants'],
    featured: false,
    answered: false,
  },
];

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

interface QuestionCardProps {
  question: typeof MOCK_QUESTIONS[0];
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const [votes, setVotes] = useState(question.votes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleVote = (voteType: 'up' | 'down') => {
    if (userVote === voteType) {
      // Remove vote
      setVotes(votes - (voteType === 'up' ? 1 : -1));
      setUserVote(null);
    } else {
      // Add or change vote
      if (userVote) {
        setVotes(votes - (userVote === 'up' ? 1 : -1));
      }
      setVotes(votes + (voteType === 'up' ? 1 : -1));
      setUserVote(voteType);
    }
  };

  const handleQuestionPress = () => {
    router.push(`/community/question-detail?id=${question.id}`);
  };

  return (
    <TouchableOpacity style={styles.questionCard} onPress={handleQuestionPress}>
      {/* Question Header */}
      <View style={styles.questionHeader}>
        <View style={styles.questionMeta}>
          {question.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color={Colors.white} />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          {question.answered && (
            <View style={styles.answeredBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.white} />
              <Text style={styles.answeredText}>Answered</Text>
            </View>
          )}
        </View>
        <Text style={styles.categoryText}>{question.category}</Text>
      </View>

      {/* Question Title */}
      <Text style={styles.questionTitle}>{question.question}</Text>
      
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

      {/* Best Answer Preview */}
      {question.bestAnswer && (
        <View style={styles.bestAnswerPreview}>
          <View style={styles.bestAnswerHeader}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.bestAnswerLabel}>Best Answer</Text>
            {question.bestAnswer.verified && (
              <Ionicons name="shield-checkmark" size={12} color={Colors.primary600} />
            )}
          </View>
          <Text style={styles.bestAnswerContent} numberOfLines={2}>
            {question.bestAnswer.content}
          </Text>
          <Text style={styles.bestAnswerAuthor}>
            by {question.bestAnswer.answeredBy}
          </Text>
        </View>
      )}

      {/* Question Footer */}
      <View style={styles.questionFooter}>
        <View style={styles.questionStats}>
          <View style={styles.votingContainer}>
            <TouchableOpacity
              style={[styles.voteButton, userVote === 'up' && styles.voteButtonActive]}
              onPress={(e) => {
                e.stopPropagation();
                handleVote('up');
              }}
            >
              <Ionicons
                name="chevron-up"
                size={16}
                color={userVote === 'up' ? Colors.white : Colors.secondary500}
              />
            </TouchableOpacity>
            <Text style={styles.voteCount}>{votes}</Text>
            <TouchableOpacity
              style={[styles.voteButton, userVote === 'down' && styles.voteButtonDown]}
              onPress={(e) => {
                e.stopPropagation();
                handleVote('down');
              }}
            >
              <Ionicons
                name="chevron-down"
                size={16}
                color={userVote === 'down' ? Colors.white : Colors.secondary500}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.questionMetrics}>
            <View style={styles.metric}>
              <Ionicons name="chatbubble-outline" size={14} color={Colors.secondary500} />
              <Text style={styles.metricText}>{question.answers}</Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="eye-outline" size={14} color={Colors.secondary500} />
              <Text style={styles.metricText}>{question.views}</Text>
            </View>
          </View>
        </View>

        <View style={styles.askedInfo}>
          <Text style={styles.askedBy}>
            asked by {question.askedBy.name}
          </Text>
          <Text style={styles.askedTime}>{formatTimeAgo(question.askedDate)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function AskQuestionScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredQuestions = selectedCategory === 'all'
    ? MOCK_QUESTIONS
    : MOCK_QUESTIONS.filter(question => question.category === selectedCategory);

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
      <FlatList
        data={filteredQuestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <QuestionCard question={item} />}
        contentContainerStyle={styles.questionsList}
        showsVerticalScrollIndicator={false}
      />
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
});
