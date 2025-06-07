import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { commentService } from '../../services/commentService';

function MentionInput({ value, onChange, teamId, placeholder, className, ...props }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (mentionQuery !== null && teamId) {
      loadTeamMembers(mentionQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [mentionQuery, teamId]);

  const loadTeamMembers = async (query) => {
    try {
      const response = await commentService.getTeamMembersForMentions(teamId, query);
      setSuggestions(response.data);
      setShowSuggestions(response.data.length > 0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error loading team members:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Always update the parent component first
    onChange(newValue);

    // Check for @ mentions - find the last @ before cursor position
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    
    // Find all @ symbols and their positions
    const atSymbols = [];
    for (let i = 0; i < textBeforeCursor.length; i++) {
      if (textBeforeCursor[i] === '@') {
        atSymbols.push(i);
      }
    }
    
    if (atSymbols.length === 0) {
      // No @ symbols found
      setMentionQuery('');
      setMentionStart(-1);
      setShowSuggestions(false);
      return;
    }
    
    // Get the last @ symbol position
    const lastAtPosition = atSymbols[atSymbols.length - 1];
    
    // Get text from last @ to cursor
    const textFromAt = textBeforeCursor.slice(lastAtPosition);
    
    // Check if this looks like a valid mention (no spaces, only allowed characters)
    const mentionMatch = textFromAt.match(/^@([\w.-]*)$/);
    
    if (mentionMatch) {
      // Valid mention pattern
      const query = mentionMatch[1];
      setMentionStart(lastAtPosition);
      setMentionQuery(query);
    } else {
      // Invalid mention pattern (contains spaces or invalid chars)
      setMentionQuery('');
      setMentionStart(-1);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const insertMention = (user) => {
    const beforeMention = value.slice(0, mentionStart);
    const afterMention = value.slice(textareaRef.current.selectionStart);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStart(-1);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = mentionStart + user.name.length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
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
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        {...props}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto border shadow-lg">
          <div className="p-1">
            {suggestions.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                  index === selectedIndex 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => insertMention(user)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default MentionInput; 