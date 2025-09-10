import axios from 'axios';
import Interaction from '../models/Interaction.js';

const DKT_API_URL = process.env.DKT_API_URL || 'http://localhost:5002';
const AXIOS_TIMEOUT = 5000; // 5 seconds

class DKTService {
  constructor() {
    this.isAvailable = false;
    this.checkAvailability();
    setInterval(() => this.checkAvailability(), 60000); // Check every 60 seconds
  }

  async checkAvailability() {
    try {
      await axios.get(`${DKT_API_URL}/dkt/status`, { timeout: 2000 });
      if (!this.isAvailable) {
        console.log('DKT service is now available.');
        this.isAvailable = true;
      }
    } catch (error) {
      if (this.isAvailable) {
        console.warn('DKT service has become unavailable.');
        this.isAvailable = false;
      }
    }
  }

  async recordInteraction(interactionData) {
    const interaction = new Interaction(interactionData);
    await interaction.save();

    if (this.isAvailable) {
      try {
        await axios.post(`${DKT_API_URL}/dkt/interaction`, {
          user_id: interactionData.userId.toString(),
          problem_id: interactionData.problemId.toString(),
          skills: interactionData.skills,
          correct: interactionData.correct,
          timestamp: interaction.timestamp.toISOString()
        }, { timeout: AXIOS_TIMEOUT });
      } catch (error) {
        console.error('Failed to send interaction to DKT service:', error.message);
      }
    }
    return interaction;
  }

  async recommendProblems(userId, availableProblems, targetDifficulty = 0.7) {
    if (!this.isAvailable) {
      return this.fallbackRecommendation(userId, availableProblems);
    }
    try {
      const response = await axios.post(`${DKT_API_URL}/dkt/recommend`, {
        user_id: userId.toString(),
        problems: availableProblems.map(p => ({
          _id: p._id.toString(),
          title: p.title,
          difficulty: p.difficulty,
          skills: p.tags,
        })),
        target_difficulty: targetDifficulty
      }, { timeout: AXIOS_TIMEOUT });
      return response.data.recommendations;
    } catch (error) {
      console.error('Error getting recommendations from DKT:', error.message);
      return this.fallbackRecommendation(userId, availableProblems);
    }
  }

  async fallbackRecommendation(userId, availableProblems) {
    // Basic fallback: return a slice of available problems.
    // A more advanced version is in your original file if needed.
    return availableProblems.slice(0, 5);
  }

  async getUserAnalytics(userId) {
    try {
      const interactions = await Interaction.find({ userId }).sort({ timestamp: -1 }).limit(100);
      const totalProblems = interactions.length;
      const correctProblems = interactions.filter(i => i.correct).length;
      const accuracy = totalProblems > 0 ? (correctProblems / totalProblems) * 100 : 0;
      let skillMastery = {};
      if (this.isAvailable) {
        try {
          const response = await axios.get(`${DKT_API_URL}/dkt/mastery/${userId}`, { timeout: AXIOS_TIMEOUT });
          skillMastery = response.data.mastery;
        } catch (e) {
            console.error('Could not fetch skill mastery:', e.message)
        }
      }
      return {
        totalProblems,
        correctProblems,
        accuracy: Math.round(accuracy),
        skillMastery,
        recentActivity: interactions.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }
}

export default new DKTService();
