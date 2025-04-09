import { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const languages = {
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    en: 'English',
    ur: 'Urdu'
  };

  // Custom styling
  const styles = `
    .chat-container {
      border-radius: 15px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }
    
    .chat-header {
      background: linear-gradient(135deg, #2e7d32, #388e3c);
      border-radius: 15px 15px 0 0;
      padding: 1.5rem;
    }
    
    .user-message {
      background: #1976d2;
      color: white;
      border-radius: 20px 20px 0 20px;
      max-width: 75%;
      margin-left: auto;
      box-shadow: 0 4px 6px rgba(25, 118, 210, 0.2);
    }
    
    .bot-message {
      background: #f8f9fa;
      border-radius: 20px 20px 20px 0;
      max-width: 75%;
      position: relative;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    
    .bot-message::before {
      content: '';
      position: absolute;
      left: -12px;
      top: 20px;
      border: 8px solid transparent;
      border-right-color: #f8f9fa;
    }
    
    .response-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .response-item {
      padding-left: 1.5rem;
      position: relative;
      margin: 0.75rem 0;
      color: #2d3436;
    }
    
    .response-item::before {
      content: '🌱';
      position: absolute;
      left: 0;
      color: #2e7d32;
    }
    
    .language-select {
      background: rgba(255,255,255,0.15) !important;
      border: 1px solid rgba(255,255,255,0.3) !important;
      color: white !important;
      backdrop-filter: blur(5px);
    }
    
    .typing-indicator {
      display: flex;
      padding: 1rem;
      justify-content: center;
    }
    
    .typing-dot {
      width: 10px;
      height: 10px;
      margin: 0 3px;
      background: #2e7d32;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }
    
    @keyframes typing {
      0%, 40%, 100% { transform: translateY(0); }
      20% { transform: translateY(-6px); }
    }
  `;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => scrollToBottom(), [messages]);

  const GEMINI_API_KEY = 'AIzaSyCnZRF-PjtViM_lN6xcM1QUZZatgaK6Jd0';

  const formatResponse = (text) => {
    return text.split('\n')
      .filter(line => line.trim())
      .map((line, index) => (
        <div key={index} className="response-item">
          {line.replace(/^\d+\.\s*/, '')}
        </div>
      ));
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    setMessages(prev => [...prev, { text: inputMessage, isBot: false }]);
    setInputMessage('');
    setLoading(true);

    try {
      const prompt = `
Act as an agricultural expert. Respond in ${languages[selectedLanguage]}.
Provide practical advice in bullet points (3-5 points) about:

"${inputMessage}"

Include:
- Simple solutions
- Natural remedies
- Safety precautions
- Cost-effective methods
- Local resources if available
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        'Could not understand the question.';

      setMessages(prev => [...prev, { text: responseText, isBot: true }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { text: `Error: ${error.message}`, isBot: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="chat-container">
        <div className="chat-header text-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <i className="fas fa-tractor fs-2"></i>
              <h2 className="m-0 fw-bold">Kisan Saathi</h2>
            </div>
            <select 
              className="form-select form-select-sm language-select w-auto"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="chat-body bg-white p-3" style={{ height: '60vh', overflowY: 'auto' }}>
          {messages.map((message, index) => (
            <div key={index} className={`my-2 ${message.isBot ? 'bot-message' : 'user-message'}`}>
              <div className="p-3">
                {message.isBot ? (
                  <div className="response-list">
                    {formatResponse(message.text)}
                  </div>
                ) : (
                  <div className="text-break">
                    {message.text}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer bg-light p-3">
          <div className="input-group">
            <input
              type="text"
              className="form-control border-success py-2"
              placeholder="Ask about crops, pests, or prices..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              className="btn btn-success px-4"
              onClick={handleSend}
              disabled={loading}
            >
              <i className="fas fa-paper-plane me-2"></i>
              Send
            </button>
          </div>
          <small className="text-muted mt-2 d-block">
            Try: "How to increase wheat yield?" or "Tomato market prices"
          </small>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;