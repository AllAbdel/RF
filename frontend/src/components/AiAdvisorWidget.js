import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Volume2, VolumeX, BarChart2, TrendingUp, AlertTriangle } from 'lucide-react';

const API_URL = "http://localhost:8000/api";

const AiAdvisorWidget = ({ agencyData, isFullPage = false }) => {
  const [isOpen, setIsOpen] = useState(isFullPage);
  const [messages, setMessages] = useState([
    { 
      role: 'system', 
      text: '👋 Bonjour ! Je suis votre conseiller IA RentFlow.\n\nJe peux analyser vos performances en temps réel. Cliquez sur **"Analyser ma flotte"** pour commencer.' 
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Synthèse vocale
  const speak = (text) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.includes('fr'));
    if (frVoice) utterance.voice = frVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  // Analyse complète
  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agencyData)
      });
      
      if (!response.ok) throw new Error('Erreur API');
      
      const data = await response.json();
      
      setAnalysisData(data.metrics);
      setMessages(prev => [...prev, { 
        role: 'system', 
        text: data.ai_analysis,
        type: 'analysis'
      }]);
      
      speak(data.voice_summary);
      
    } catch (error) {
      console.error('Erreur analyse:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        text: '❌ Impossible de se connecter au service IA. Vérifiez que le serveur Python est lancé (port 8000).' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Envoi de message chat
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText("");
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: 'user', 
          content: userMsg,
          context: agencyData
        })
      });
      
      if (!response.ok) throw new Error('Erreur API');
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'system', 
        text: data.reply,
        sentiment: data.sentiment
      }]);
      
      speak(data.reply);
      
    } catch (error) {
      console.error('Erreur chat:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        text: '❌ Erreur de connexion au service IA.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format du message avec Markdown basique
  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  // Mode full page (onglet dédié)
  if (isFullPage) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <BarChart2 size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Assistant IA RentFlow</h1>
                <p className="text-blue-100 flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Service actif
                </p>
              </div>
            </div>
            <button 
              onClick={() => setAudioEnabled(!audioEnabled)} 
              className="hover:bg-white/10 p-3 rounded-lg transition-colors"
            >
              {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        {analysisData && (
          <div className="max-w-6xl mx-auto w-full px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-500">Taux d'occupation</p>
                    <p className="text-2xl font-bold text-gray-800">{analysisData.utilization_rate?.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <BarChart2 className="text-green-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-500">Revenue récent</p>
                    <p className="text-2xl font-bold text-gray-800">{analysisData.recent_revenue?.toFixed(0)}€</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-orange-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-500">Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-800">{analysisData.satisfaction_rate?.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-6 pb-6 flex flex-col min-h-0">
          <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden border border-gray-200">
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : msg.sentiment === 'warning'
                        ? 'bg-orange-50 text-gray-800 border border-orange-200 rounded-bl-none'
                        : 'bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 p-4 rounded-2xl rounded-bl-none border border-gray-200">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-gray-50 flex gap-2 overflow-x-auto border-t border-gray-200">
              <button 
                onClick={handleAnalysis}
                disabled={isLoading}
                className="whitespace-nowrap px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium transition-all shadow-sm disabled:opacity-50"
              >
                ✨ Analyser ma flotte
              </button>
              <button 
                onClick={() => { setInputText("Quelle est ma meilleure voiture ?"); handleSendMessage(); }}
                disabled={isLoading}
                className="whitespace-nowrap px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 font-medium transition-colors disabled:opacity-50"
              >
                🏆 Meilleur véhicule
              </button>
              <button 
                onClick={() => { setInputText("Comment augmenter mes revenus ?"); handleSendMessage(); }}
                disabled={isLoading}
                className="whitespace-nowrap px-4 py-2 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 font-medium transition-colors disabled:opacity-50"
              >
                💰 Conseils Prix
              </button>
              <button 
                onClick={() => { setInputText("Stratégie marketing ?"); handleSendMessage(); }}
                disabled={isLoading}
                className="whitespace-nowrap px-4 py-2 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 font-medium transition-colors disabled:opacity-50"
              >
                📢 Marketing
              </button>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder="Posez votre question..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode widget flottant (pour d'autres pages)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <div className="relative">
            <MessageCircle size={28} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[380px] flex flex-col overflow-hidden border border-gray-200 h-[600px]">
          {/* Header compact */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full">
                <BarChart2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Assistant IA</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> En ligne
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAudioEnabled(!audioEnabled)} className="hover:bg-white/10 p-1 rounded">
                {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-xl rounded-bl-none border border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="p-2 bg-gray-50 flex gap-2 overflow-x-auto border-t border-gray-100">
            <button 
              onClick={handleAnalysis}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 font-medium transition-colors disabled:opacity-50"
            >
              ✨ Analyser
            </button>
            <button 
              onClick={() => { setInputText("Conseils prix ?"); handleSendMessage(); }}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 font-medium transition-colors disabled:opacity-50"
            >
              💰 Prix
            </button>
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Votre question..."
                disabled={isLoading}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 disabled:opacity-50"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className={`p-2 rounded-full transition-colors ${
                  inputText.trim() && !isLoading ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 bg-gray-200'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAdvisorWidget;
