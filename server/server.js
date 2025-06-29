const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // ✅ works in CommonJS

require('dotenv').config();
console.log("🔐 OpenRouter API Key Loaded:", process.env.OPENROUTER_API_KEY ? "Yes" : "No");
console.log("📂 Looking for .env in:", __dirname);
const fs = require('fs');
console.log("📄 .env exists:", fs.existsSync(__dirname + '/.env'));



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// for quiez
const generateQuiz = (topic, difficulty = 'medium') => {
  const quizBank = {
  math: [
    { question: "What is 15 × 7?", options: ["105", "95", "115", "100"], correct: 0 },
    { question: "Solve: 2x + 5 = 13", options: ["x = 4", "x = 6", "x = 3", "x = 9"], correct: 0 },
    { question: "What is the area of a circle with radius 3?", options: ["9π", "6π", "3π", "12π"], correct: 0 },
    { question: "Simplify: √64", options: ["8", "6", "10", "4"], correct: 0 },
    { question: "What is 25% of 80?", options: ["20", "15", "25", "30"], correct: 0 }
  ],
  science: [
    { question: "What is the chemical symbol for gold?", options: ["Au", "Ag", "Go", "Gd"], correct: 0 },
    { question: "How many bones are in the adult human body?", options: ["206", "208", "204", "210"], correct: 0 },
    { question: "What gas do plants absorb during photosynthesis?", options: ["CO2", "O2", "N2", "H2"], correct: 0 },
    { question: "What is the speed of light?", options: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10⁷ m/s", "3×10⁹ m/s"], correct: 0 },
    { question: "Which planet is closest to the Sun?", options: ["Mercury", "Venus", "Earth", "Mars"], correct: 0 }
  ],
  history: [
    { question: "In what year did World War II end?", options: ["1945", "1944", "1946", "1943"], correct: 0 },
    { question: "Who was the first President of the United States?", options: ["George Washington", "John Adams", "Thomas Jefferson", "Benjamin Franklin"], correct: 0 },
    { question: "Which empire was ruled by Julius Caesar?", options: ["Roman Empire", "Greek Empire", "Persian Empire", "Ottoman Empire"], correct: 0 },
    { question: "What year did the Berlin Wall fall?", options: ["1989", "1987", "1991", "1985"], correct: 0 },
    { question: "Who painted the Mona Lisa?", options: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], correct: 0 }
  ]
};

  const topicQuestions = quizBank[topic.toLowerCase()] || quizBank.math;
  const shuffled = [...topicQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

// ai install 
const generateChatResponse = async (message) => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
      model: 'deepseek/deepseek-r1:free',
        messages: [
          { role: 'system', content: 'You are a helpful educational tutor.' },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    console.log("📨 DeepSeek raw response:", JSON.stringify(data, null, 2));

    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    } else if (data?.error) {
      return `API Error: ${data.error.message}`;
    } else {
      return 'DeepSeek returned no valid message.';
    }
  } catch (error) {
    console.error('❌ DeepSeek API error:', error);
    return 'DeepSeek API request failed.';
  }
};
// dashboard

const generateProgress = (userId) => {
  return {
    userId,
    totalQuizzes: Math.floor(Math.random() * 20) + 5,
    averageScore: Math.floor(Math.random() * 30) + 70,
    subjects: {
      math: {
        completed: Math.floor(Math.random() * 10) + 3,
        score: Math.floor(Math.random() * 20) + 75
      },
      science: {
        completed: Math.floor(Math.random() * 8) + 2,
        score: Math.floor(Math.random() * 25) + 70
      },
      history: {
        completed: Math.floor(Math.random() * 6) + 1,
        score: Math.floor(Math.random() * 30) + 65
      }
    },
    streakDays: Math.floor(Math.random() * 15) + 1,
    lastActive: new Date().toISOString()
  };
};

// API 
app.post('/api/quiz', (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const questions = generateQuiz(topic, difficulty);
    res.json({
      success: true,
      topic,
      difficulty: difficulty || 'medium',
      questions,
      totalQuestions: questions.length,
      timeLimit: 300
    });
  } catch {
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});


app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const reply = await generateChatResponse(message);
    res.json({ success: true, reply, timestamp: new Date().toISOString(), userId: userId || 'guest' });
  } catch {
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.get('/api/progress/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const progress = generateProgress(userId);
    res.json({ success: true, progress });
  } catch {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.post('/api/quiz/submit', (req, res) => {
  try {
    const { userId, topic, score, answers, timeSpent } = req.body;
    res.json({ success: true, message: 'Quiz results saved successfully', score, feedback: score >= 70 ? 'Excellent work!' : score >= 50 ? 'Good effort! Keep practicing.' : 'Keep learning, you\'ll improve!' });
  } catch {
    res.status(500).json({ error: 'Failed to submit quiz results' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'EduMuse API is running!', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 EduMuse backend server running on port ${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   POST /api/quiz - Generate quiz questions`);
  console.log(`   POST /api/chat - AI chat responses`);
  console.log(`   GET /api/progress/:userId - User progress`);
  console.log(`   POST /api/quiz/submit - Submit quiz results`);
  console.log(`   GET /api/health - Health check`);
});

module.exports = app;
