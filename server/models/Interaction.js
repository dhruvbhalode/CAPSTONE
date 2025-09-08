import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  skills: [{ type: String, required: true }],
  correct: { type: Boolean, required: true },
  timeSpent: { type: Number }, // in seconds
  hintsUsed: { type: Number, default: 0 },
  attempts: { type: Number, default: 1 },
  phase: {
    type: String,
    enum: ['reading', 'mcq', 'coding', 'completed'],
    required: true
  },
  mcqScore: { type: Number }, // percentage score on MCQ questions
  codeSubmitted: { type: String }, // the actual code submitted
  timestamp: { type: Date, default: Date.now }
});

// Index for efficient querying
interactionSchema.index({ userId: 1, timestamp: -1 });
interactionSchema.index({ problemId: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction;