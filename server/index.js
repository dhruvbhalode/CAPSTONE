import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';
import Problem from './models/Problem.js';
import Interaction from './models/Interaction.js';
import dktService from './services/dktService.js';

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'your-very-secret-key';

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Auth Routes ---
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, avatar: `https://i.pravatar.cc/150?u=${email}` });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, SECRET_KEY, { expiresIn: '1h' });
    res.status(201).json({ token, user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error during sign up.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// --- Problem Routes ---
app.get('/api/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching problem' });
  }
});

// --- User Progress Routes ---
app.get('/api/users/:userId/solved-problems', async (req, res) => {
  try {
    const { userId } = req.params;
    const solvedInteractions = await Interaction.find({ 
      userId, 
      correct: true 
    }).distinct('problemId');
    
    const solvedProblems = await Problem.find({
      _id: { $in: solvedInteractions }
    });
    res.json(solvedProblems);
  } catch (error) {
    console.error('Error fetching solved problems:', error);
    res.status(500).json({ message: 'Error fetching solved problems' });
  }
});

// --- Recommendation Routes ---
app.get('/api/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const solvedProblemIds = await Interaction.distinct('problemId', { userId, correct: true });
    const availableProblems = await Problem.find({ _id: { $nin: solvedProblemIds } }).limit(20);
    const recommendations = await dktService.recommendProblems(userId, availableProblems);
    res.json(recommendations.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: 'Error getting recommendations' });
  }
});

// --- Analytics & Interaction Routes ---
app.get('/api/analytics/:userId', async (req, res) => {
  try {
    const analytics = await dktService.getUserAnalytics(req.params.userId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error getting analytics' });
  }
});

app.post('/api/interactions', async (req, res) => {
  try {
    const interaction = await dktService.recordInteraction(req.body);
    const user = await User.findById(req.body.userId);
    if (user) {
      if (req.body.correct && req.body.phase === 'completed') {
        user.solvedProblems = (user.solvedProblems || 0) + 1;
      }
      const total = await Interaction.countDocuments({ userId: req.body.userId });
      const correct = await Interaction.countDocuments({ userId: req.body.userId, correct: true });
      user.accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      await user.save();
    }
    res.status(201).json(interaction);
  } catch (error) {
    res.status(500).json({ message: 'Error recording interaction' });
  }
});

// --- Server Startup ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
