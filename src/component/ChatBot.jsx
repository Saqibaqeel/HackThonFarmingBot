import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('unrequested');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const recognition = useRef(null);

  const languages = {
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    en: 'English',
    ur: 'Urdu'
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.maxAlternatives = 1;

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  useEffect(() => {
    if (recognition.current) {
      const languageMap = {
        en: 'en-US',
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        ur: 'ur-PK'
      };
      recognition.current.lang = languageMap[selectedLanguage] || 'en-US';
    }
  }, [selectedLanguage]);

  const toggleRecording = () => {
    if (!recognition.current) return;
    
    if (isRecording) {
      recognition.current.stop();
    } else {
      try {
        recognition.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone access error:', error);
        setIsRecording(false);
      }
    }
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
    }

    .price-response {
      border-left: 4px solid #2e7d32;
      background: #f0fff4;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 0.5rem 0;
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

    .language-select {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 0.25rem 1rem;
      border-radius: 0.5rem;
    }

    .input-container {
      padding: 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .audio-input {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      width: 100%;
    }

    .mic-button {
      background: ${isRecording ? '#dc3545' : '#2e7d32'};
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
    }

    .mic-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
      opacity: 0.65;
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
  `;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, [styles]);

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
      if (/(location|where am i|मेरा स्थान|నా స్థానం|என் இடம்)/i.test(userMessage)) {
        let responseText = '';
        switch(locationStatus) {
          case 'granted':
            responseText = 'Using your location for accurate prices 🌍';
            break;
          case 'denied':
            responseText = 'Location access denied. Showing general prices 🔒';
            break;
          case 'unsupported':
            responseText = 'Browser doesn\'t support location 🌐'; // Fixed apostrophe
            break;
          default:
            responseText = 'Location not requested yet 📊';
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
            text: '📍 Enable location for local prices', 
            isBot: true 
          }]);
          return;
        }

        if (location) {
          locationContext = `User Location: ${location.lat},${location.lng}. `;
          usedLocation = true;
        } else {
          locationContext = 'National average prices. ';
        }
      }

      const currentDate = new Date().toLocaleDateString('en-IN');
      const prompt = isPriceQuery 
        ? `${locationContext}Provide ${languages[selectedLanguage]} prices for: "${userMessage}".
           Date: ${currentDate}
           - Current ₹/kg
           - Nearest markets
           - Price trend
           - MSP comparison
           - Influencing factors` 
        : `As agricultural expert (${languages[selectedLanguage]}), answer: "${userMessage}".
           Include:
           - Practical steps
           - Local materials
           - Cost range
           - Best timing
           - Safety tips`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ 
                text: prompt + 
                  (location ? `\nCoordinates: ${location.lat},${location.lng}` : "")
              }]
            }]
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
                (Clear)
              </button>
            </>
          ) : (
            <button 
              className="btn btn-success btn-sm"
              onClick={getLocation}
            >
              {locationStatus === 'denied' ? 'Retry Location' : 'Enable Location'}
            </button>
          )}
        </div>

        <div className="audio-input">
          <button
            type="button"
            className="mic-button"
            onClick={toggleRecording}
            disabled={!recognition.current}
            title={recognition.current ? 
              (isRecording ? "Stop recording" : "Start recording") : 
              "Speech recognition not supported"}
          >
            {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <input
            type="text"
            className="form-control"
            placeholder="Speak or type your question..."
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