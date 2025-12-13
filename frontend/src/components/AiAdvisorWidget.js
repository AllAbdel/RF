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
      <div className="h-full flex flex-col" style={{ 
        background: 'var(--bg-secondary)'
      }}>
        {/* Header minimaliste */}
        <div style={{ 
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-primary)'
        }} className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div style={{ 
                background: 'var(--accent-primary)',
                boxShadow: 'var(--shadow-accent)'
              }} className="p-3 rounded-xl">
                <BarChart2 size={26} strokeWidth={2.5} style={{ color: 'white' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Assistant IA RentFlow</h1>
                <p className="flex items-center gap-2 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }}></span>
                  Service connecté
                </p>
              </div>
            </div>
            <button 
              onClick={() => setAudioEnabled(!audioEnabled)} 
              style={{ 
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-secondary)'
              }}
              className="hover:opacity-80 p-3 rounded-xl transition-all"
            >
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>

        {/* Metrics Dashboard épuré */}
        {analysisData && (
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div style={{ 
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)'
              }} className="p-5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Taux d'occupation</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{analysisData.utilization_rate?.toFixed(0)}%</p>
                  </div>
                  <TrendingUp size={32} style={{ color: 'var(--accent-primary)' }} />
                </div>
              </div>
              <div style={{ 
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)'
              }} className="p-5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Revenue 30j</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{analysisData.recent_revenue?.toFixed(0)}€</p>
                  </div>
                  <BarChart2 size={32} style={{ color: 'var(--success)' }} />
                </div>
              </div>
              <div style={{ 
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-md)'
              }} className="p-5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Satisfaction</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{analysisData.satisfaction_rate?.toFixed(0)}%</p>
                  </div>
                  <AlertTriangle size={32} style={{ color: 'var(--warning)' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container qui prend toute la largeur */}
        <div className="flex-1 px-8 pb-8 flex flex-col min-h-0">
          <div style={{ 
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)'
          }} className="rounded-2xl flex-1 flex flex-col overflow-hidden">
            
            {/* Messages épurés */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div 
                    style={msg.role === 'user' 
                      ? { 
                          background: 'var(--accent-primary)',
                          boxShadow: 'var(--shadow-accent)',
                          color: 'white'
                        }
                      : msg.sentiment === 'warning'
                      ? { 
                          background: 'var(--warning-bg)',
                          border: '1px solid var(--warning-border)',
                          color: 'var(--text-primary)'
                        }
                      : { 
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-secondary)',
                          color: 'var(--text-primary)'
                        }
                    }
                    className="max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed"
                  >
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-fadeIn">
                  <div style={{ 
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-secondary)'
                  }} className="p-4 rounded-2xl">
                    <div className="flex space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)' }}></div>
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '0.1s' }}></div>
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions minimalistes */}
            <div className="p-4 flex gap-2 overflow-x-auto" style={{ 
              background: 'var(--bg-secondary)', 
              borderTop: '1px solid var(--border-primary)' 
            }}>
              <button 
                onClick={handleAnalysis}
                disabled={isLoading}
                style={{ 
                  background: 'var(--accent-primary)',
                  color: 'white',
                  boxShadow: 'var(--shadow-accent)'
                }}
                className="whitespace-nowrap px-5 py-2.5 text-sm rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              >
                ✨ Analyser ma flotte
              </button>
              <button 
                onClick={() => { setInputText("Quelle est ma meilleure voiture ?"); handleSendMessage(); }}
                disabled={isLoading}
                style={{ 
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  border: '1px solid var(--success-border)'
                }}
                className="whitespace-nowrap px-5 py-2.5 text-sm rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              >
                🏆 Meilleur véhicule
              </button>
              <button 
                onClick={() => { setInputText("Comment augmenter mes revenus ?"); handleSendMessage(); }}
                disabled={isLoading}
                style={{ 
                  background: 'var(--info-bg)',
                  color: 'var(--info)',
                  border: '1px solid var(--info-border)'
                }}
                className="whitespace-nowrap px-5 py-2.5 text-sm rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              >
                💰 Conseils Prix
              </button>
              <button 
                onClick={() => { setInputText("Stratégie marketing ?"); handleSendMessage(); }}
                disabled={isLoading}
                style={{ 
                  background: 'var(--warning-bg)',
                  color: 'var(--warning)',
                  border: '1px solid var(--warning-border)'
                }}
                className="whitespace-nowrap px-5 py-2.5 text-sm rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              >
                📢 Marketing
              </button>
            </div>

            {/* Input épuré */}
            <div className="p-5" style={{ 
              background: 'var(--bg-secondary)', 
              borderTop: '1px solid var(--border-primary)' 
            }}>
              <div className="flex items-center gap-3" style={{ 
                background: 'var(--bg-tertiary)',
                borderRadius: '12px',
                padding: '4px',
                border: '1px solid var(--border-secondary)'
              }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder="Posez votre question à l'assistant IA..."
                  disabled={isLoading}
                  style={{ color: 'var(--text-primary)' }}
                  className="flex-1 bg-transparent px-4 py-3 outline-none text-sm placeholder-gray-500 disabled:opacity-50"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  style={inputText.trim() && !isLoading ? { 
                    background: 'var(--accent-primary)',
                    boxShadow: 'var(--shadow-accent)'
                  } : { 
                    background: 'var(--bg-hover)',
                    color: 'var(--text-tertiary)'
                  }}
                  className="p-3 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                >
                  <Send size={20} style={{ color: inputText.trim() && !isLoading ? 'white' : 'var(--text-tertiary)' }} />
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
          style={{ 
            background: 'var(--accent-primary)',
            boxShadow: 'var(--shadow-accent)'
          }}
          className="rounded-full p-4 flex items-center gap-2 transition-all transform hover:scale-110"
        >
          <div className="relative">
            <MessageCircle size={28} strokeWidth={2.5} style={{ color: 'white' }} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }}></span>
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--success)' }}></span>
            </span>
          </div>
        </button>
      )}

      {isOpen && (
        <div style={{ 
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }} className="rounded-2xl w-[400px] flex flex-col overflow-hidden h-[600px]">
          {/* Header minimaliste */}
          <div style={{ 
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-primary)'
          }} className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div style={{ 
                background: 'var(--accent-primary)'
              }} className="p-2 rounded-lg">
                <BarChart2 size={20} strokeWidth={2.5} style={{ color: 'white' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Assistant IA</h3>
                <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }}></span>
                  Connecté
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAudioEnabled(!audioEnabled)} 
                style={{ 
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }} 
                className="hover:opacity-80 p-2 rounded-lg transition-all"
              >
                {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ 
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }} 
                className="hover:opacity-80 p-2 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages épurés */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--bg-secondary)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div 
                  style={msg.role === 'user' 
                    ? { 
                        background: 'var(--accent-primary)',
                        boxShadow: 'var(--shadow-accent)',
                        color: 'white'
                      }
                    : { 
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-secondary)',
                        color: 'var(--text-primary)'
                      }
                  }
                  className="max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed"
                >
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div style={{ 
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-secondary)'
                }} className="p-3 rounded-2xl">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent-primary)', animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions minimalistes */}
          <div className="p-3 flex gap-2 overflow-x-auto" style={{ 
            background: 'var(--bg-tertiary)', 
            borderTop: '1px solid var(--border-primary)' 
          }}>
            <button 
              onClick={handleAnalysis}
              disabled={isLoading}
              style={{ 
                background: 'var(--accent-primary)',
                color: 'white',
                boxShadow: 'var(--shadow-sm)'
              }}
              className="whitespace-nowrap px-4 py-2 text-xs rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            >
              ✨ Analyser
            </button>
            <button 
              onClick={() => { setInputText("Conseils prix ?"); handleSendMessage(); }}
              disabled={isLoading}
              style={{ 
                background: 'var(--success-bg)',
                color: 'var(--success)',
                border: '1px solid var(--success-border)'
              }}
              className="whitespace-nowrap px-4 py-2 text-xs rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            >
              💰 Prix
            </button>
          </div>

          {/* Input épuré */}
          <div className="p-3" style={{ 
            background: 'var(--bg-tertiary)', 
            borderTop: '1px solid var(--border-primary)' 
          }}>
            <div className="flex items-center gap-2" style={{ 
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '4px',
              border: '1px solid var(--border-secondary)'
            }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Votre question..."
                disabled={isLoading}
                style={{ color: 'var(--text-primary)' }}
                className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500 px-3 py-2 disabled:opacity-50"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                style={inputText.trim() && !isLoading ? { 
                  background: 'var(--accent-primary)',
                  boxShadow: 'var(--shadow-sm)'
                } : { 
                  background: 'var(--bg-hover)',
                  color: 'var(--text-tertiary)'
                }}
                className="p-2.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
              >
                <Send size={18} style={{ color: inputText.trim() && !isLoading ? 'white' : 'var(--text-tertiary)' }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAdvisorWidget;
