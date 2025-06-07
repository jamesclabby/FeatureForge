import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Reply, Edit, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MentionInput from './MentionInput';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';

function CommentItem({ comment, teamId, onUpdate, onDelete, onReplyAdded, depth = 0 }) {
  const maxDepth = 3; // Maximum nesting depth
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment?.content || '');
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Safety check for comment object
  if (!comment) {
    console.warn('CommentItem received null/undefined comment');
    return null;
  }

  // Safety check for required fields
  const safeComment = {
    id: comment.id,
    content: comment.content || '',
    author: comment.author || { name: 'Unknown User' },
    createdAt: comment.createdAt || new Date().toISOString(),
    isEdited: comment.isEdited || false,
    featureId: comment.featureId,
    replies: comment.replies || []
  };

  const isAuthor = currentUser && currentUser.uid && safeComment.author?.id === currentUser.uid;

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await commentService.updateComment(safeComment.id, {
        content: editContent.trim()
      });
      onUpdate(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentService.deleteComment(safeComment.id);
      onDelete(safeComment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await commentService.createComment(safeComment.featureId, {
        content: replyContent.trim(),
        parentId: safeComment.id
      });
      onReplyAdded(safeComment.id, response.data);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = (content) => {
    // Check if content exists and is a string
    if (!content || typeof content !== 'string') {
      return '';
    }
    // Simple mention highlighting - allow dots, hyphens, underscores in usernames
    return content.replace(/@([\w.-]+)/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded">@$1</span>');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* Comment Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(safeComment.author?.name || 'Unknown')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{safeComment.author?.name || 'Unknown User'}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(safeComment.createdAt), { addSuffix: true })}
                {safeComment.isEdited && (
                  <span className="ml-1 text-gray-400">(edited)</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isAuthor && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2">
            <MentionInput
              value={editContent}
              onChange={setEditContent}
              teamId={teamId}
              className="min-h-[60px]"
            />
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={submitting || !editContent.trim()}
                className="flex items-center space-x-1"
              >
                <Check className="h-3 w-3" />
                <span>Save</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(safeComment.content);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="text-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: renderContent(safeComment.content) }}
          />
        )}

        {/* Reply Button */}
        {!isEditing && depth < maxDepth && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center space-x-1 text-gray-600"
            >
              <Reply className="h-3 w-3" />
              <span>Reply</span>
            </Button>
          </div>
        )}

        {/* Reply Form */}
        {isReplying && (
          <div className="space-y-2 mt-3">
            <MentionInput
              value={replyContent}
              onChange={setReplyContent}
              teamId={teamId}
              placeholder="Write a reply..."
              className="min-h-[60px]"
            />
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={submitting || !replyContent.trim()}
                className="flex items-center space-x-1"
              >
                <Reply className="h-3 w-3" />
                <span>{submitting ? 'Replying...' : 'Reply'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {safeComment.replies && safeComment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {safeComment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              teamId={teamId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReplyAdded={onReplyAdded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem; 