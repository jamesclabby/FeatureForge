import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader } from '../ui/card';
import chatService from '../../services/chatService';

const AIChatWidget = ({ teamId, teamName, userRole }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [aiStatus, setAiStatus] = useState('unknown');
  const [actualTeamName, setActualTeamName] = useState(teamName);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = useCallback(async () => {
    try {
      const page = chatService.getCurrentPageContext();
      const response = await chatService.getSuggestions(page, teamId);
      
      // If response includes context with team name, update it
      if (response && typeof response === 'object' && response.context?.teamName) {
        setActualTeamName(response.context.teamName);
        setSuggestions(response.suggestions || response);
      } else {
        setSuggestions(response);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [teamId]);

  const refreshSuggestions = useCallback(() => {
    // Clear current suggestions and reload them to get fresh data
    setSuggestions([]);
    loadSuggestions();
  }, [loadSuggestions]);

  const checkAIStatus = useCallback(async () => {
    try {
      await chatService.checkHealth();
      setAiStatus('healthy');
    } catch (error) {
      setAiStatus('error');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load suggestions when expanded or when team changes
  useEffect(() => {
    if (isExpanded && teamId) {
      loadSuggestions();
    }
  }, [isExpanded, teamId, loadSuggestions]);

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus();
  }, [checkAIStatus]);

  // Clear messages and refresh suggestions when team changes
  useEffect(() => {
    if (teamId) {
      setMessages([]);
      setSuggestions([]);
      // Reset team name to the prop value when team changes
      setActualTeamName(teamName);
      // Refresh suggestions to get latest team data
      if (isExpanded) {
        setTimeout(() => loadSuggestions(), 100);
      }
    }
  }, [teamId, teamName, isExpanded, loadSuggestions]);

  // Refresh suggestions periodically when chat is open to keep data fresh
  useEffect(() => {
    if (isExpanded && teamId) {
      const refreshInterval = setInterval(() => {
        refreshSuggestions();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(refreshInterval);
    }
  }, [isExpanded, teamId, refreshSuggestions]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  // Don't render if no team is selected
  if (!teamId) {
    return null;
  }

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      // Prepare conversation history for the AI (last 10 messages to avoid token limits)
      const conversationHistory = updatedMessages
        .slice(-10) // Keep last 10 messages
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        }));

      // Send message to AI with conversation history
      const response = await chatService.sendMessage(userMessage, teamId, conversationHistory);
      
      // Update actual team name from API response if available
      if (response.context?.teamName) {
        setActualTeamName(response.context.teamName);
      }
      
      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.message,
        timestamp: new Date(),
        provider: response.provider,
        suggestedAction: response.suggestedAction,
        actionExecuted: response.actionExecuted
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Refresh suggestions after sending a message to ensure they reflect any data changes
      // that might have occurred during the conversation
      setTimeout(() => refreshSuggestions(), 500);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatMessageContent = (content) => {
    return chatService.formatMessage(content);
  };

  const handleActionExecution = async (action, parameters) => {
    try {
      setIsLoading(true);
      
      // Execute the action
      const result = await chatService.executeAction(action, parameters);
      
      // Add success message
      const successMessage = {
        id: Date.now(),
        type: 'system',
        content: `✅ **Action completed!** ${result.message}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, successMessage]);
      
      // Refresh suggestions to reflect changes
      setTimeout(() => refreshSuggestions(), 500);
      
    } catch (error) {
      console.error('Failed to execute action:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        content: `❌ Failed to execute action: ${error.message}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-h-[calc(100vh-2rem)]">
      {/* Expanded Chat Window */}
      {isExpanded && (
        <Card className="mb-4 w-80 max-h-[calc(100vh-6rem)] shadow-lg border-2 border-blue-200 bg-white relative flex flex-col">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <div>
                <h3 className="font-semibold text-sm text-gray-800">AI Assistant</h3>
                <p className="text-xs text-gray-600">{actualTeamName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {aiStatus === 'healthy' && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="AI Online" />
              )}
              {aiStatus === 'error' && (
                <div className="w-2 h-2 bg-red-500 rounded-full" title="AI Offline" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshSuggestions}
                className="h-6 w-6 p-0 hover:bg-gray-200"
                title="Refresh suggestions with latest data"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col flex-1 min-h-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <p>Hi! I'm your FeatureForge AI assistant.</p>
                  <p className="text-xs mt-1">Ask me about features, analytics, or team insights.</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : message.type === 'system'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatMessageContent(message.content)
                      }}
                    />
                    {message.provider && (
                      <div className="text-xs opacity-70 mt-1">
                        via {message.provider}
                      </div>
                    )}
                    
                    {/* Action buttons for AI suggestions */}
                    {message.suggestedAction && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1">Suggested action:</div>
                        <div className="text-xs text-blue-600 mb-2">
                          {message.suggestedAction.action.replace('_', ' ')} - {Object.keys(message.suggestedAction.parameters).length} parameters
                        </div>
                        <button
                          onClick={() => handleActionExecution(message.suggestedAction.action, message.suggestedAction.parameters)}
                          disabled={isLoading}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isLoading ? 'Executing...' : 'Execute Action'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 0 && suggestions.length > 0 && (
              <div className="p-3 border-t bg-gray-50 flex-shrink-0">
                <p className="text-xs text-gray-600 mb-2">Try asking:</p>
                <div className="space-y-1">
                  {suggestions.slice(0, 2).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left text-xs p-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t bg-white relative flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 text-sm pr-12"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="px-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Collapse Button - positioned in bottom right corner of input area */}
              <Button
                onClick={toggleExpanded}
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg bg-gray-600 hover:bg-gray-700 transition-all duration-200 z-10"
                title="Minimize chat"
              >
                <ChevronUp className="h-4 w-4 text-white" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Chat Button - only show when collapsed */}
      {!isExpanded && (
        <Button
          onClick={toggleExpanded}
          className="h-12 w-12 rounded-full shadow-lg transition-all duration-200 bg-blue-600 hover:bg-blue-700 hover:scale-110"
          title="Open AI assistant"
        >
          <MessageCircle className="h-5 w-5 text-white" />
          {aiStatus === 'healthy' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </Button>
      )}
    </div>
  );
};

export default AIChatWidget; 