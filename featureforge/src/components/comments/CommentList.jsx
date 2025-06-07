import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { MessageCircle, Reply, Edit, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentItem from './CommentItem';
import MentionInput from './MentionInput';
import { commentService } from '../../services/commentService';

function CommentList({ featureId, teamId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComments();
  }, [featureId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentService.getComments(featureId);
      setComments(response.data);
    } catch (error) {
      console.error('Error loading comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await commentService.createComment(featureId, {
        content: newComment.trim()
      });
      
      setComments(prev => [...prev, response.data]);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
      setError('Failed to create comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentUpdate = (updatedComment) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleCommentDelete = (deletedCommentId) => {
    setComments(prev => 
      prev.filter(comment => comment.id !== deletedCommentId)
    );
  };

  const handleReplyAdded = (parentId, newReply) => {
    const addReplyToComment = (comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      
      // If this comment has replies, recursively search them
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.map(addReplyToComment)
        };
      }
      
      return comment;
    };

    setComments(prev => prev.map(addReplyToComment));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <span className="text-gray-500">Loading comments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              Comments ({comments.length})
            </h3>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* New Comment Form */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              teamId={teamId}
              placeholder="Write a comment... Use @username to mention team members"
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  teamId={teamId}
                  onUpdate={handleCommentUpdate}
                  onDelete={handleCommentDelete}
                  onReplyAdded={handleReplyAdded}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CommentList; 