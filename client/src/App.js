import React, { useState, useEffect } from 'react';
import { Book, MessageCircle, BarChart3, CheckCircle, Clock, Brain, Trophy } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const api = {
  generateQuiz: async (topic, difficulty = 'medium') => {
  const response = await fetch(`${API_BASE}/quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ topic, difficulty })
  });

  if (!response.ok) throw new Error('Failed to fetch quiz');

  const data = await response.json();
  return {
    success: true,
    topic,
    difficulty,
    questions: data.questions,
    totalQuestions: data.questions.length,
    timeLimit: 300
  };
},
    
    
  
  sendChatMessage: async (message) => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  if (!response.ok) throw new Error('Failed to get AI response');

  const data = await response.json();
    console.log("📨 Frontend received reply:", data);

  return {
    success: true,
    reply: data.reply,
    timestamp: new Date().toISOString()
  };
},

  
  getProgress: async (userId = 'demo-user') => {
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          progress: {
            userId,
            totalQuizzes: 12,
            averageScore: 78,
            subjects: {
              math: { completed: 5, score: 82 },
              science: { completed: 4, score: 76 },
              history: { completed: 3, score: 74 }
            },
            streakDays: 7,
            lastActive: new Date().toISOString()
          }
        });
      }, 800);
    });
  }
};

const EduMuse = () => {
  const [activeTab, setActiveTab] = useState('quiz');
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  // Quiz Generation
  const generateQuiz = async (topic) => {
    setLoading(true);
    try {
      const response = await api.generateQuiz(topic);
      setQuiz(response);
      setCurrentQuestion(0);
      setScore(0);
      setQuizComplete(false);
      setSelectedAnswer(null);
    } catch (error) {
      console.error('Error generating quiz:', error);
    }
    setLoading(false);
  };

  // Quiz Navigation
  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const nextQuestion = () => {
    if (selectedAnswer === quiz.questions[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    if (currentQuestion + 1 < quiz.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setQuizComplete(true);
    }
  };
// chat
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { text: chatInput, sender: 'user', timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const response = await api.sendChatMessage(chatInput);
      const aiMessage = { text: response.reply, sender: 'ai', timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setChatLoading(false);
  };

  // Load Progress
  useEffect(() => {
    if (activeTab === 'dashboard') {
      api.getProgress().then(response => {
        setProgress(response.progress);
      });
    }
  }, [activeTab]);

  const QuizComponent = () => (
    <div className="max-w-4xl mx-auto">
      {!quiz ? (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-xl text-white">
            <Brain className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">AI Quiz Generator</h2>
            <p className="text-lg opacity-90">Choose a topic and test your knowledge with AI-generated questions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Mathematics', 'Science', 'History'].map(topic => (
              <button
                key={topic}
                onClick={() => generateQuiz(topic.toLowerCase())}
                disabled={loading}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-gray-200"
              >
                <div className="text-2xl mb-2">
                  {topic === 'Mathematics' && '🔢'}
                  {topic === 'Science' && '🔬'}
                  {topic === 'History' && '📚'}
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{topic}</h3>
                <p className="text-gray-600 mt-2">Test your {topic.toLowerCase()} knowledge</p>
              </button>
            ))}
          </div>
          
          {loading && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Generating questions...</span>
            </div>
          )}
        </div>
      ) : quizComplete ? (
        <div className="text-center space-y-6">
          <div className="bg-green-50 p-8 rounded-xl border border-green-200">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-3xl font-bold text-green-800 mb-2">Quiz Complete!</h2>
            <p className="text-xl text-green-700">You scored {score} out of {quiz.questions.length}</p>
            <p className="text-lg text-green-600 mt-2">
              {score === quiz.questions.length ? 'Perfect score! 🎉' : 
               score >= quiz.questions.length * 0.7 ? 'Great job! 👏' : 'Keep practicing! 💪'}
            </p>
          </div>
          
          <button
            onClick={() => setQuiz(null)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Another Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold capitalize">{quiz.topic} Quiz</h2>
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-medium mb-4">
                {quiz.questions[currentQuestion].question}
              </h3>
              
              <div className="space-y-3">
                {quiz.questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  </button>
                ))}
              </div>
              
              <button
                onClick={nextQuestion}
                disabled={selectedAnswer === null}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {currentQuestion + 1 === quiz.questions.length ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ChatComponent = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 rounded-xl text-white mb-6">
        <MessageCircle className="w-12 h-12 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-center">AI Tutor Chat</h2>
        <p className="text-center opacity-90">Ask me anything! I'm here to help you learn.</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p>👋 Hi! I'm your AI tutor. Ask me any question about math, science, history, or any other subject!</p>
            </div>
          )}
          
          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t p-4">
          <div className="flex space-x-2">
           <input
    type="text"
    value={chatInput}
    onChange={(e) => setChatInput(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
    placeholder="Ask me anything..."
    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
  />
  <button
    onClick={sendMessage}
    disabled={!chatInput.trim() || chatLoading}
    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
  >
    Send
  </button>
</div>
        </div>
      </div>
    </div>
  );

  const DashboardComponent = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-xl text-white mb-6">
        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-center">Learning Dashboard</h2>
        <p className="text-center opacity-90">Track your progress and achievements</p>
      </div>
      
      {progress ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Book className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{progress.totalQuizzes}</p>
                <p className="text-gray-600">Total Quizzes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{progress.averageScore}%</p>
                <p className="text-gray-600">Average Score</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{progress.streakDays}</p>
                <p className="text-gray-600">Day Streak</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {Object.values(progress.subjects).reduce((sum, subject) => sum + subject.completed, 0)}
                </p>
                <p className="text-gray-600">Completed</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      )}
      
      {progress && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Subject Progress</h3>
          <div className="space-y-4">
            {Object.entries(progress.subjects).map(([subject, data]) => (
              <div key={subject} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{subject}</span>
                  <span className="text-sm text-gray-600">{data.completed} completed • {data.score}% avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                    style={{ width: `${data.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">EduMuse</h1>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              AI-Powered Learning
            </span>
          </div>
        </div>
      </div>
    </header>

    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {[
            { id: 'quiz', label: 'Quiz Generator', icon: Book },
            { id: 'chat', label: 'AI Tutor', icon: MessageCircle },
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {activeTab === 'quiz' && <QuizComponent />}
      {activeTab === 'chat' && <ChatComponent />}
      {activeTab === 'dashboard' && <DashboardComponent />}
    </main>

    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-center text-gray-600">
          EduMuse - AI-Powered Educational Platform • Built with React & Node.js
        </p>
      </div>
    </footer>
  </div>
);

};
export default EduMuse;