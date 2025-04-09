import { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('unrequested');
  const messagesEndRef = useRef(null);

  const languages = {
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    en: 'English',
    ur: 'Urdu'
  };

  const styles = `
    .chat-container {
      max-width: 800px;
      margin: 2rem auto;
      border-radius: 1rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
      background: white;
    }

    .chat-header {
      background: linear-gradient(135deg, #2e7d32, #388e3c);
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-body {
      height: 60vh;
      padding: 1.5rem;
      overflow-y: auto;
      background: #f8fafc;
    }

    .message-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .user-message {
      align-self: flex-end;
      background: #1976d2;
      color: white;
      border-radius: 1rem 1rem 0 1rem;
      max-width: 85%;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);
    }

    .bot-message {
      align-self: flex-start;
      background: white;
      border-radius: 1rem 1rem 1rem 0;
      max-width: 85%;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      position: relative;
    }

    .price-response {
      border-left: 4px solid #2e7d32;
      background: #f0fff4;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 0.5rem 0;
    }

    .location-warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .language-select {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 0.25rem 1rem;
      border-radius: 0.5rem;
    }

    .typing-indicator {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      justify-content: center;
    }

    .typing-dot {
      width: 10px;
      height: 10px;
      background: #2e7d32;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    @keyframes typing {
      0%, 40%, 100% { transform: translateY(0); }
      20% { transform: translateY(-6px); }
    }

    .input-container {
      padding: 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .location-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
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

  const getLocation = () => {
    setLocationStatus('requesting');
    
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('granted');
      },
      (error) => {
        setLocationStatus('denied');
        console.error('Geolocation error:', error);
      },
      { timeout: 10000 }
    );
  };

  const formatResponse = (text, isPrice) => {
    if (isPrice) {
      return (
        <div className="price-response">
          {text.split('\n').map((line, index) => (
            <div key={index} className="response-item">
              🌱 {line.replace(/^\d+\.\s*/, '')}
            </div>
          ))}
        </div>
      );
    }
    return text.split('\n').map((line, index) => (
      <div key={index} className="response-item">
        {line}
      </div>
    ));
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInputMessage('');
    setLoading(true);

    try {
      // Handle location queries
      if (/(location|where am i|मेरा स्थान|నా స్థానం|என் இடம்)/i.test(userMessage)) {
        let responseText = '';
        switch(locationStatus) {
          case 'granted':
            responseText = 'I am using your location to provide accurate local prices 🌍';
            break;
          case 'denied':
            responseText = 'Location access denied. Showing general market prices 🔒';
            break;
          case 'unsupported':
            responseText = 'Browser does not support location services 🌐';
            break;
          default:
            responseText = 'Location not requested yet. Prices are national averages 📊';
        }
        
        setMessages(prev => [...prev, { 
          text: responseText, 
          isBot: true,
          isPrice: false
        }]);
        return;
      }

      const isPriceQuery = /(price|rate|मूल्य|दर|விலை|ధర|قیمت)/i.test(userMessage);
      let locationContext = '';
      let usedLocation = false;

      if (isPriceQuery) {
        if (!location && locationStatus !== 'denied') {
          getLocation();
          setMessages(prev => [...prev, { 
            text: '📍 Enable location access for accurate local prices', 
            isBot: true 
          }]);
          return;
        }

        if (location) {
          locationContext = `User Coordinates: ${location.lat},${location.lng}. `;
          usedLocation = true;
        } else {
          locationContext = 'No location available. Provide national average prices. ';
        }
      }

      const prompt = isPriceQuery 
        ? `${locationContext}Provide current market prices in ${languages[selectedLanguage]} for: "${userMessage}". 
           Include exact numbers, sources, and price trends.`
        : `Act as agricultural expert in ${languages[selectedLanguage]}. 
           Respond to: "${userMessage}". Include practical, location-aware solutions.`;

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

      setMessages(prev => [...prev, { 
        text: responseText, 
        isBot: true,
        isPrice: isPriceQuery,
        usedLocation 
      }]);

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
    <div className="chat-container">
      <div className="chat-header">
        <div className="d-flex align-items-center gap-3">
          <h2 className="m-0 text-white">🌾 Kisan Saathi</h2>
        </div>
        <select 
          className="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {Object.entries(languages).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      <div className="chat-body">
        <div className="message-container">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={message.isBot ? 'bot-message' : 'user-message'}
            >
              {formatResponse(message.text, message.isPrice)}
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
      </div>

      <div className="input-container">
        <div className="location-status">
          {locationStatus === 'granted' ? (
            <>
              <span>📍 Location Enabled</span>
              <button 
                className="btn btn-link btn-sm"
                onClick={() => setLocation(null)}
              >
                (Clear Location)
              </button>
            </>
          ) : (
            <button 
              className="btn btn-success btn-sm"
              onClick={getLocation}
            >
              {locationStatus === 'denied' ? 'Retry Location Access' : 'Enable Local Prices'}
            </button>
          )}
        </div>

        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Ask about crops, pests, or prices..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            className="btn btn-success"
            onClick={handleSend}
            disabled={loading}
          >
            Send
          </button>
        </div>
        
        <div className="text-center mt-2 text-muted small">
          Try: "Tomato prices near me" or "Best crops for my region"
        </div>
      </div>
    </div>
  );
};

export default ChatBot;