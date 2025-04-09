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
    en: 'English'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  let GEMINI_API_KEY='AIzaSyCnZRF-PjtViM_lN6xcM1QUZZatgaK6Jd0'

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    setMessages(prev => [...prev, { text: inputMessage, isBot: false }]);
    setInputMessage('');
    setLoading(true);

    try {
      const prompt = `
        Act as an agricultural expert. Respond in ${languages[selectedLanguage]}.
        Provide information about:
        - Pest control
        - Fertilizers
        - Market prices
        - Farming techniques
        
        For query: "${inputMessage}"
        
        Guidelines:
        1. Use simple terms
        2. Give practical solutions
        3. Include safety measures
        4. Use metric units
      `;

      // Log the API key
    //   console.log('API KEY:', process.env.REACT_APP_GEMINI_API_KEY);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      // Log the raw response status
      console.log('Response status:', response.status);

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      // Log the full response data
      console.log('API Response Data:', data);

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        'Could not understand the question';

      setMessages(prev => [...prev, { text: responseText, isBot: true }]);
    } catch (error) {
      console.error('Error during API call:', error); // Log the error
      setMessages(prev => [...prev, { 
        text: 'Connection error. Please try again later.', 
        isBot: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow-lg">
        <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">
            <i className="fas fa-robot me-2"></i>
            Kisan Saathi 🌾
          </h3>
          <div className="w-25">
            <select 
              className="form-select form-select-sm"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-body" style={{ height: '60vh', overflowY: 'auto' }}>
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`d-flex ${message.isBot ? 'justify-content-start' : 'justify-content-end'} mb-3`}
            >
              <div 
                className={`p-3 rounded-3 ${message.isBot ? 
                  'bg-light text-dark' : 
                  'bg-primary text-white'}`}
                style={{ maxWidth: '80%' }}
              >
                {message.text.split('\n').map((line, i) => (
                  <p key={i} className="mb-0">{line}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-center my-3">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="card-footer">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Ask your farming question..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              className="btn btn-success"
              onClick={handleSend}
              disabled={loading}
            >
              <i className="fas fa-paper-plane me-2"></i>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
