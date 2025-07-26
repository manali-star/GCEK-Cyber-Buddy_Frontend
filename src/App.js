import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Login from './Login';
import Register from './Register';
import Sidebar from './Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import { DarkModeProvider, useDarkMode } from './contexts/DarkModeContext';
import { Github, Linkedin, Mail, Menu } from 'lucide-react';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import quickhealLogo from './assets/quickheal.png';
import GCEKlogo from './assets/GCEK.png';

function App() {
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [urlToScan, setUrlToScan] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleScanUrl = async () => {
    if (!urlToScan.trim()) {
      setError('Please enter a URL to scan');
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/chat/virustotal-scan`,
        { url: urlToScan },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const resultMessage = `🔍 URL Scan Results for: ${urlToScan}:
    - ✅ Safe: ${response.data.harmless || 0}
    - ⚠️ Suspicious: ${response.data.suspicious || 0}
    - ❌ Malicious: ${response.data.malicious || 0}`;

      await sendMessageLogic(resultMessage, currentSessionId);
      setUrlToScan('');
    } catch (error) {
      console.error('Scan failed:', error);
      setError(error.response?.data?.error || 'Failed to scan URL');
    } finally {
      setIsScanning(false);
    }
  };


  const handlePasswordReset = () => { };

  const togglePage = (path) => {
    if (location.pathname === path) {
      navigate('/');
    } else {
      navigate(path);
    }
  };
  const [categorizedChatSessions, setCategorizedChatSessions] = useState({
    today: [],
    yesterday: [],
    older: []
  });

  const categorizeChats = useCallback((sessions) => {
    const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const isToday = (someDate) => isSameDay(someDate, new Date());

    const isYesterday = (someDate) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return isSameDay(someDate, yesterday);
    };
    const todayChats = [];
    const yesterdayChats = [];
    const olderChats = [];

    const sortedSessions = [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedSessions.forEach(session => {
      const createdAtDate = new Date(session.createdAt);
      if (isToday(createdAtDate)) {
        todayChats.push(session);
      } else if (isYesterday(createdAtDate)) {
        yesterdayChats.push(session);
      } else {
        olderChats.push(session);
      }
    });

    return {
      today: todayChats,
      yesterday: yesterdayChats,
      older: olderChats
    };
  }, []);

  const startNewChatSession = useCallback(() => {
    const newSessionId = 'new_' + Date.now();
    const newSession = {
      _id: newSessionId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setChatSessions(prev => {
      const filteredPrev = prev.filter(session => !session._id.startsWith('new_'));
      const updatedSessions = [newSession, ...filteredPrev];
      setCategorizedChatSessions(categorizeChats(updatedSessions));
      return updatedSessions;
    });

    setCurrentSessionId(newSessionId);
    setMessages([]);
    setSource('');
  }, [categorizeChats]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (token) {
      axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/chat/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
        .then(response => {
          const history = response.data.history || [];
          setChatSessions(history);
          setCategorizedChatSessions(categorizeChats(history));
          startNewChatSession();
        })
        .catch(err => {
          console.error('Failed to load history:', err);
          startNewChatSession();
        });
    } else {
      setChatSessions([]);
      setCategorizedChatSessions({ today: [], yesterday: [], older: [] });
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [token, categorizeChats, startNewChatSession]);

  const handleAuth = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    navigate('/');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessageLogic(inputMessage.trim(), currentSessionId);
    setInputMessage('');
  };

  const sendMessageLogic = async (messageText, currentSessId) => {
    if (!currentSessId) {
      console.warn("No current session ID found, starting a new one for message send.");
      await startNewChatSession();
      return;
    }

    const userMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setChatSessions(prevSessions => {
      const updatedSessions = prevSessions.map(session =>
        session._id === currentSessId
          ? { ...session, messages: [...(session.messages || []), userMessage] }
          : session
      );
      setCategorizedChatSessions(categorizeChats(updatedSessions));
      return updatedSessions;
    });
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    setError('');

    try {
      const payload = {
        message: messageText,
        sessionId: currentSessId
      };

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

      const { response: aiReply, source: aiSource, sessionId: newSessionIdFromBackend } = response.data;

      const aiMessage = {
        text: aiReply,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        source: aiSource
      };
      setSource(aiSource);

      setChatSessions(prevSessions => {
        const finalUpdatedChatSessions = prevSessions.map(session => {
          if (session._id === currentSessId || (newSessionIdFromBackend && session._id === newSessionIdFromBackend)) {
            const updatedSession = {
              ...session,
              _id: newSessionIdFromBackend || session._id,
              messages: [...(session.messages || []), aiMessage],
              updatedAt: new Date().toISOString()
            };
            if (updatedSession.title === "New Chat") {
              updatedSession.title = messageText.substring(0, 30) + (messageText.length > 30 ? '...' : '');
            }
            return updatedSession;
          }
          return session;
        });

        if (newSessionIdFromBackend && currentSessId.startsWith('new_')) {
          setCurrentSessionId(newSessionIdFromBackend);
        }

        setCategorizedChatSessions(categorizeChats(finalUpdatedChatSessions));
        return finalUpdatedChatSessions;
      });

      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get response from AI');
      const errorMessage = {
        text: 'Failed to get response from AI',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setChatSessions(prevSessions => {
        const updatedSessionsForError = prevSessions.map(session =>
          session._id === currentSessId
            ? { ...session, messages: [...(session.messages || []), errorMessage] }
            : session
        );
        setCategorizedChatSessions(categorizeChats(updatedSessionsForError));
        return updatedSessionsForError;
      });
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectChat = (sessionId) => {
    const selectedSession = chatSessions.find(session => session._id === sessionId);
    if (selectedSession) {
      setCurrentSessionId(sessionId);
      setMessages(selectedSession.messages || []);
      setSource(selectedSession.messages?.[selectedSession.messages.length - 1]?.source || '');
    }
  };

  const handleDeleteChat = async (sessionIdToDelete) => {
    if (!window.confirm("Are you sure you want to delete this chat history? This action cannot be undone.")) {
      return;
    }

    if (sessionIdToDelete.startsWith('new_')) {
      const updatedSessions = chatSessions.filter(session => session._id !== sessionIdToDelete);
      setChatSessions(updatedSessions);
      setCategorizedChatSessions(categorizeChats(updatedSessions));

      if (currentSessionId === sessionIdToDelete) {
        startNewChatSession();
      }
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/chat/${sessionIdToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

      const updatedSessions = chatSessions.filter(session => session._id !== sessionIdToDelete);
      setChatSessions(updatedSessions);
      setCategorizedChatSessions(categorizeChats(updatedSessions));

      if (currentSessionId === sessionIdToDelete) {
        startNewChatSession();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError(err.response?.data?.message || 'Failed to delete chat.');
    }
  };

  const commonPageWrapper = (title, Component) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <Component />
      </div>
    </div>
  );

  if (!token) {
    return (
      <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pink-100 via-purple-100 to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500 ease-in-out">
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword onSuccess={handlePasswordReset} />} />
          <Route path="/reset-password" element={<ResetPassword onSuccess={handlePasswordReset} />} />
          <Route path="*" element={
            <>
              <main className="flex-grow">
                <section className="pt-10 px-4 text-center">
                  <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 mx-auto font-semibold">
                    Cyber Shakti Club, GCEK presents
                  </p>
                  <h6 className="sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 text-center">
                    "A software developed to educate and protect users from cybercrime while offering seamless support!"
                  </h6>
                  <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient"
                      style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
                      GCEK Cyber Buddy
                    </span>
                  </h1>
                  <p className="sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 text-center">
                    "24x7 Cyber Buddy – Ask, Learn, Stay Alert, Stay Secure"
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                    <button onClick={() => togglePage('/login')} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg shadow-lg transition-transform hover:scale-105">
                      Get Started
                    </button>
                    <button onClick={() => togglePage('/register')} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow-lg transition-transform hover:scale-105">
                      Create Account
                    </button>
                  </div>

                  <div className="w-full mx-auto max-w-md">
                    <Routes>
                      <Route path="/login" element={
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 mb-4 animate-fade-in">
                          <Login onAuth={handleAuth} />
                        </div>
                      } />
                      <Route path="/register" element={
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 mb-4 animate-fade-in">
                          <Register onAuth={handleAuth} />
                        </div>
                      } />
                    </Routes>
                  </div>
                </section>

                <div className='max-w-6xl mx-auto flex flex-col md:flex-row items-center bg-gradient-to-r from-white/10 to-white/5 dark:from-gray-800/50 dark:to-gray-900/40 rounded-3xl border-white/10 backdrop-blur-md p-8  shadow-xl transition hover:scale-[1.02] hover:shadow-2xl duration-300 mb-2 '>
                  <section className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">🤝 In Collaboration With </h2>
                    <div className="grid sm:grid-cols-2 gap-10">
                      {[
                        {
                          image: GCEKlogo,
                          title: 'Govt. College of Engineering, Karad',
                          desc: 'Institutional support, development, testing, and outreach.'
                        },
                        {
                          image: quickhealLogo,
                          title: '',
                          subtitle: '',
                          desc: 'Cyber Shiksha for Cyber Suraksha'
                        }].map((item, i) => (
                          <div key={i} className="flex flex-col items-center p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-xlbg-gradient-to-r from-white/10 to-white/5 :from-gray-800/50 shadow-lg dark:to-gray-900/40 dark:text-white">
                            <img src={item.image} alt={item.title || "Collaboration Logo"} className="h-24 w-auto mx-auto mb-4 object-contain" />
                            <h3 className="font-bold text-xl mb-2 text-cyan-600 dark:text-cyan-400">{item.title}</h3>
                            {item.subtitle && <p className="text-base font-semibold text-cyan-700 dark:text-cyan-500 mb-3">{item.subtitle}</p>}
                            <p className="text-base text-gray-800 font-semibold dark:text-gray-300 text-center leading-relaxed">{item.desc}</p>
                          </div>)
                        )}
                    </div>
                  </section>
                </div>

                <section className="py-12 px-4">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl dark:text-white font-bold text-center mb-8">What it will do</h2>
                    <div className="grid sm:grid-cols-2 gap-16">
                      {[
                        {
                          icon: '🤖',
                          title: 'AI Assistant',
                          desc: 'This 24/7 chatbot acts as your personal cybercrime prevention expert. Its always available to provide immediate, actionable advice and information on a wide range of cyber threats.'
                        },
                        {
                          icon: '🔍',
                          title: 'URL Saftey Checker',
                          desc: ' Users can paste any suspicious link in chatbot, Chatbot checks and informs Whether the link is verified/safe	If its a phishing/malicious link.'
                        },
                        {
                          icon: '⚡',
                          title: 'Real-time Cybercrime Guidance',
                          desc: 'Provides instant answers to queries related to phishing, online fraud, hacking, data breaches, and digital harassment. Guides users on how to recognize suspicious activities.'
                        },
                        {
                          icon: '🤝',
                          title: 'Victim Support',
                          desc: 'This feature provides crucial guidance and resources for individuals who have fallen victim to cybercrime. It offers clear, step-by-step instructions on how to report incidents to the appropriate authorities, such as cyber cells.'
                        },
                        {
                          icon: '📚',
                          title: 'Awareness & Education',
                          desc: 'Delivers bite-sized lessons, tips, and quiz modules on cyber safety. Educates users on topics like password safety, email scams, and safe social media usage.'
                        },
                        {
                          icon: '🔒',
                          title: 'Privacy First',
                          desc: 'This foundational principle ensures that user data remains exclusively on their device, Unlike cloud-based systems, "Privacy First" means no personal information or sensitive interactions are uploaded, stored, or processed externally. '
                        }
                      ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 text-center dark:text-white">
                          <span className="text-4xl mb-3 block">{item.icon}</span>
                          <h3 className="font-bold text-lg  mb-2">{item.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="max-w-4xl mx-auto flex justify-center mb-8 ">
                  <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl border border-green-300/30 dark:border-emerald-500/30 flex flex-col items-center text-center w-full max-w-md shadow-lg shadow-green-100/20 dark:shadow-emerald-900/10  transition transform hover:scale-[1.02] hover:shadow-2xl duration-300">
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Need Help? Contact Us!</h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-2"><span className="font-semibold text-cyan-600 dark:text-cyan-400">National Helpline:</span> 1930</p>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-2"><span className="font-semibold text-cyan-600 dark:text-cyan-400">Cyber Crime Portal:</span><a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">cybercrime.gov.in</a></p>
                    <p className="text-lg text-gray-700 dark:text-gray-300"><span className="font-semibold text-cyan-600 dark:text-cyan-400">GCEK Cyber Shakti Club Helpline:</span>+91-9876543210</p>
                  </div>
                </div>
              </main>
            </>
          } />
        </Routes>

        <footer className="w-full text-center py-4 bg-white/60 dark:bg-white/10 text-gray-800 dark:text-gray-300 backdrop-blur-md rounded-t-xl shadow-inner border-t border-white/30 dark:border-white/10">
          <div className="text-sm flex flex-col items-center justify-center sm:justify-between ">
            <div className="flex items-center space-x-3">
              AI Chatbot © {new Date().getFullYear()} | Developed by
              <span className="text-blue-600 dark:text-blue-400 font-semibold ml-2 text-lg ">Cyber Shakti Club,GCEK</span>
              <a
                href="https://github"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 transition duration-300 "
              >
                <Github className="w-5 h-5 hover:scale-125 transition-transform" />
              </a>
              <a
                href="https://www.linkedin.com/in/omkar-bidave/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 transition duration-300"
              >
                <Linkedin className="w-5 h-5 hover:scale-125 transition-transform" />
              </a>
              <a
                href="mailto:omkarrbidave108@gmail.com"
                className="hover:text-blue-500 transition duration-300"
              >
                <Mail className="w-5 h-5 hover:scale-125 transition-transform" />
              </a>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs mt-2">
            <button onClick={() => togglePage('/about')} className="hover:underline">
              {location.pathname === '/about' ? 'Hide About' : 'About'}
            </button>
            <button onClick={() => togglePage('/privacy')} className="hover:underline">
              Privacy Policy
            </button>
            <button onClick={() => togglePage('/terms')} className="hover:underline">
              {location.pathname === '/terms' ? 'Hide Terms' : 'Terms'}
            </button>
            <button onClick={() => togglePage('/contact')} className="hover:underline">
              Contact
            </button>
          </div>
        </footer>

        <Routes>
          <Route path="/about" element={commonPageWrapper('About', About)} />
          <Route path="/privacy" element={commonPageWrapper('Privacy Policy', PrivacyPolicy)} />
          <Route path="/terms" element={commonPageWrapper('Terms of Service', Terms)} />
          <Route path="/contact" element={commonPageWrapper('Contact Us', Contact)} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        chatSessions={categorizedChatSessions}
        currentSessionId={currentSessionId}
        onSelectChat={handleSelectChat}
        onNewChat={startNewChatSession}
        onDeleteChat={handleDeleteChat}
        setToken={setToken}
        setMessages={setMessages}
        setChatSessions={setChatSessions}
        setCategorizedChatSessions={setCategorizedChatSessions}
        setCurrentSessionId={setCurrentSessionId}
        navigate={navigate}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div className={`flex flex-col flex-1 relative transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-start items-center sticky top-0 z-10 text-gray-800 dark:text-white ">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold ml-2 md:ml-0">"GCEK Cyber Buddy"</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
          <div className="flex flex-col gap-4 w-full px-2 sm:px-4 md:px-6 lg:px-8" style={{ minHeight: 'max-content' }}>{messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? (msg.text.startsWith('🔍 URL Scan Results for:') ? 'justify-start' : 'justify-end') : 'justify-start '} w-full`}>
              <div className={`relative max-w-[90%] rounded-lg p-3 break-words ${msg.sender === 'user' ? (msg.text.startsWith('🔍 URL Scan Results for:') ? 'bg-gray-100 dark:bg-gray-700 border order-gray-200 dark:border-gray-600' : 'bg-blue-500 text-white') : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                {msg.sender === 'ai' ? (
                  <div className="prose dark:prose-invert max-w-none text-base">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                      pre: ({ node, ...props }) => (
                        <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded-md overflow-x-auto my-2" {...props} />
                      ),
                      code: ({ node, ...props }) => (
                        <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-xs" {...props} />
                      )
                    }}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start">
                      <p className="text-base whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                )}
                {msg.file?.type === 'image' && msg.file?.content && (
                  <img
                    src={`data:image/png;base64,${msg.file.content}`}
                    alt={msg.file.name || 'Uploaded image'}
                    className="mt-2 rounded max-h-48 shadow-md"
                  />
                )}

                {msg.file?.type === 'text' && msg.file?.content && (
                  <div className="mt-2 bg-gray-100 dark:bg-gray-700  p-2 rounded text-sm max-h-32 overflow-y-auto">
                    <p className="font-semibold text-blue-600 dark:text-blue-300">
                      {msg.file.name || 'Text File'}
                    </p>
                    <pre className=" text-gray-800 dark:text-white whitespace-pre-wrap">{msg.file.content}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
            {isTyping && (
              <div className="flex justify-start w-full">
                <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 max-w-[90%]">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSendMessage} className="space-y-3 max-w-4xl mx-auto px-2 sm:px-8">
            <div className="flex flex-row gap-1">
              {showUrlInput ? (
                <textarea
                  value={urlToScan}
                  onChange={(e) => setUrlToScan(e.target.value)}
                  placeholder="Enter URL to scan"
                  rows={3}
                  autoFocus
                  className="border rounded-lg px-4 py-2 w-full resize-none dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="border rounded-lg px-4 py-2 w-full resize-none dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className={`w-24 h-10 rounded-full  ${showUrlInput ? 'bg-blue-600' : 'bg-red-500 dark:bg-red-600'} text-white`}
                  title={showUrlInput ? 'Switch to message' : 'Scan URL'}
                >
                  {showUrlInput ? 'Chat' : 'Verify URLs'}
                </button>
                {showUrlInput ? (
                  <button
                    type="button"
                    onClick={handleScanUrl}
                    disabled={isScanning}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isScanning ? 'Scanning...' : 'Scan'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isTyping}
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <DarkModeProvider>
      <Router>
        <App />
      </Router>
    </DarkModeProvider>
  );
}