import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
});

const mcqQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, required: true },
  category: {
    type: String,
    enum: ['data-structure', 'algorithm', 'approach'],
    required: true
  }
});

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  description: { type: String, required: true },
  inputFormat: { type: String, required: true },
  outputFormat: { type: String, required: true },
  constraints: [{ type: String }],
  testCases: [testCaseSchema],
  tags: [{ type: String, required: true }], // These are the skills
  hints: [{ type: String }],
  optimalSolution: { type: String },
  mcqQuestions: [mcqQuestionSchema],
  leetcodeUrl: { type: String, trim: true }, // Added for dynamic export link
  estimatedTime: { type: Number }, // in minutes
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

problemSchema.index({ tags: 1 });
problemSchema.index({ difficulty: 1 });

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;