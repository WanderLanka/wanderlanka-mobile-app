import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../services/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const Colors = {
  primary: '#059669',
  primary100: '#dcfce7',
  primary600: '#059669',
  primary700: '#047857',
  secondary500: '#64748b',
  secondary400: '#94a3b8',
  secondary600: '#475569',
  white: '#ffffff',
  black: '#000000',
  light100: '#f1f5f9',
  light200: '#e2e8f0',
  error: '#ef4444',
  blue: '#3b82f6',
};

interface Comment {
  _id: string;
  content: string;
  author: {
    userId?: string;
    username: string;
    profilePicture?: string | null;
  };
  level: number;
  likesCount: number;
  repliesCount: number;
  isLikedByUser: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  onClose: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch comments
  const fetchComments = useCallback(async (pageNum = 1) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const baseUrl = API_CONFIG.BASE_URL;
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${baseUrl}/api/community/posts/${postId}/comments?page=${pageNum}&limit=20`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      
      console.log('📦 Fetched comments:', data.data?.comments?.length || 0);
      if (data.data?.comments?.length > 0) {
        console.log('First comment structure:', JSON.stringify(data.data.comments[0], null, 2));
      }
      
      if (pageNum === 1) {
        setComments(data.data.comments);
      } else {
        setComments(prev => [...prev, ...data.data.comments]);
      }
      
      setHasMore(data.data.pagination.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  // Submit comment
  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      return;
    }

    if (!user) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      console.log('📝 Posting comment...');
      console.log('Token exists:', !!token);
      console.log('User:', user?.username);
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again to comment');
        setIsSubmitting(false);
        return;
      }
      
      const baseUrl = API_CONFIG.BASE_URL;

      const body: any = {
        content: commentText.trim(),
      };

      if (replyingTo) {
        body.parentCommentId = replyingTo.id;
      }

      console.log('Request URL:', `${baseUrl}/api/community/posts/${postId}/comments`);
      console.log('Request body:', body);

      const response = await fetch(
        `${baseUrl}/api/community/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to post comment');
      }

      const data = await response.json();
      
      // Add new comment to the list
      if (replyingTo) {
        // If it's a reply, we need to update the parent comment's replies
        // For simplicity, just refresh all comments
        fetchComments(1);
      } else {
        // Add to top of list
        setComments([data.data.comment, ...comments]);
      }

      setCommentText('');
      setReplyingTo(null);
      Alert.alert('Success', 'Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like/Unlike comment
  const handleToggleLike = async (commentId: string, isLiked: boolean) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like comments');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const baseUrl = API_CONFIG.BASE_URL;

      const method = isLiked ? 'DELETE' : 'POST';

      const response = await fetch(
        `${baseUrl}/api/community/comments/${commentId}/like`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();

      // Update comment in list
      updateCommentInList(commentId, {
        likesCount: data.data.likesCount,
        isLikedByUser: data.data.isLikedByUser,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  // Helper to update a comment in the nested structure
  const updateCommentInList = (commentId: string, updates: Partial<Comment>) => {
    setComments(prevComments => {
      return prevComments.map(comment => {
        if (comment._id === commentId) {
          return { ...comment, ...updates };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply._id === commentId ? { ...reply, ...updates } : reply
            ),
          };
        }
        return comment;
      });
    });
  };

  // Load more replies for a comment
  const handleLoadMoreReplies = async (commentId: string) => {
    // In a real implementation, you would fetch more replies from the API
    // For now, we'll just show a message
    Alert.alert('Load More', 'Loading more replies...');
  };

  // Render single comment
  const renderComment = (comment: Comment, isReply = false) => {
    const hasMoreReplies = comment.repliesCount > (comment.replies?.length || 0);

    // Safety check for author data
    if (!comment || !comment.author) {
      console.warn('Comment missing author data:', comment);
      return null;
    }

    return (
      <View
        key={comment._id}
        style={[styles.commentContainer, isReply && styles.replyContainer]}
      >
        {/* User Avatar */}
        <View style={styles.commentAvatar}>
          {comment.author?.profilePicture ? (
            <Image
              source={{ uri: comment.author.profilePicture }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person-circle" size={32} color={Colors.secondary400} />
          )}
        </View>

        {/* Comment Content */}
        <View style={styles.commentContent}>
          {/* Username and Time */}
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{comment.author?.username || 'Unknown'}</Text>
            <Text style={styles.commentTime}>
              {formatTime(comment.createdAt)}
            </Text>
          </View>

          {/* Comment Text */}
          <Text style={styles.commentText}>{comment.content}</Text>

          {/* Action Buttons */}
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleToggleLike(comment._id, comment.isLikedByUser)}
            >
              <Ionicons
                name={comment.isLikedByUser ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.isLikedByUser ? Colors.error : Colors.secondary500}
              />
              <Text
                style={[
                  styles.actionText,
                  comment.isLikedByUser && styles.likedText,
                ]}
              >
                {comment.likesCount > 0 ? comment.likesCount : 'Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setReplyingTo({ id: comment._id, username: comment.author.username })}
            >
              <Ionicons name="arrow-undo-outline" size={16} color={Colors.secondary500} />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          </View>

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {comment.replies.map(reply => renderComment(reply, true))}
            </View>
          )}

          {/* Load More Replies Button */}
          {hasMoreReplies && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => handleLoadMoreReplies(comment._id)}
            >
              <Ionicons name="chevron-down" size={16} color={Colors.primary600} />
              <Text style={styles.loadMoreText}>
                View {comment.repliesCount - (comment.replies?.length || 0)} more {comment.repliesCount - (comment.replies?.length || 0) === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Format time helper
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Header - Outside safe area */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.white }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Comments List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary600} />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={Colors.secondary400} />
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>Be the first to comment!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={({ item }) => renderComment(item)}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.commentsList}
          onEndReached={() => {
            if (hasMore && !isLoading) {
              fetchComments(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator size="small" color={Colors.primary600} style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}

      {/* Comment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          {/* Reply Indicator */}
          {replyingTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyText}>
                Replying to @{replyingTo.username}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close-circle" size={20} color={Colors.secondary400} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="send" size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {/* Character Count */}
          <Text style={styles.charCount}>{commentText.length}/1000</Text>
        </View>
      </KeyboardAvoidingView>
      
      {/* Bottom Safe Area */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: Colors.white }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light200,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary500,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.secondary400,
    marginTop: 4,
  },
  commentsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 12,
  },
  commentAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.secondary400,
  },
  commentText: {
    fontSize: 14,
    color: Colors.secondary600,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    color: Colors.secondary500,
    marginLeft: 6,
    fontWeight: '500',
  },
  likedText: {
    color: Colors.error,
  },
  repliesContainer: {
    marginTop: 8,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  loadMoreText: {
    fontSize: 13,
    color: Colors.primary600,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light200,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 13,
    color: Colors.secondary600,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.black,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.secondary400,
  },
  charCount: {
    fontSize: 11,
    color: Colors.secondary400,
    textAlign: 'right',
    marginTop: 4,
  },
});

export default CommentSection;
