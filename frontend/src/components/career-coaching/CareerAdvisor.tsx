import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'advisor';
  content: string;
  timestamp: Date;
}

interface AdvisorContext {
  userProfile?: {
    currentRole: string;
    targetRole: string;
    industry: string;
  };
  careerGoals?: any[];
  currentSkills?: string[];
}

export const CareerAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'How do I advance to a senior role?',
    'What skills should I learn for my target role?',
    'How can I improve my interview skills?',
    'What are good networking strategies?',
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/career-coaching/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: {},
        }),
      });

      const data = await response.json();

      const advisorMessage: ChatMessage = {
        role: 'advisor',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, advisorMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'advisor',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="career-advisor-container">
      <div className="advisor-header">
        <h2>AI Career Advisor</h2>
        <p>Your personal career coach for guidance and recommendations</p>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="advisor-avatar">🤖</div>
            <h3>Hello! I'm your AI Career Advisor</h3>
            <p>I can help you with:</p>
            <ul>
              <li>Career planning and goal setting</li>
              <li>Skills development recommendations</li>
              <li>Interview preparation tips</li>
              <li>Leadership and advancement strategies</li>
              <li>Networking advice</li>
            </ul>
            <div className="suggestions">
              <p>Try asking:</p>
              <div className="suggestion-buttons">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => handleSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message advisor">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything about your career..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default CareerAdvisor;
