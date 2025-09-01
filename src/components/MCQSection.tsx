import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, Brain } from 'lucide-react';
import { useProblem } from '../contexts/ProblemContext';

interface MCQSectionProps {
  problemId: string;
  onComplete: () => void;
}

export default function MCQSection({ problemId, onComplete }: MCQSectionProps) {
  const { getMCQsForProblem } = useProblem();
  const mcqQuestions = getMCQsForProblem(problemId);

  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    // Reset state when problem changes
    setCurrentMCQIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
  }, [problemId]);

  const currentQuestion = mcqQuestions[currentMCQIndex];

  if (!currentQuestion) return null;

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return;
    setSelectedAnswer(answerIndex);
    setAnswered(true);
  };

  const handleNext = () => {
    if (currentMCQIndex < mcqQuestions.length - 1) {
      setCurrentMCQIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      onComplete();
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="h-full flex flex-col p-6">
      <h3 className="text-lg font-bold text-white flex items-center mb-4"><Brain className="h-5 w-5 text-blue-400 mr-2" />Understanding Check ({currentMCQIndex + 1}/{mcqQuestions.length})</h3>
      <p className="text-gray-300 text-lg mb-4">{currentQuestion.question}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={answered}
            className={`p-3 text-left rounded-lg border transition-colors ${
              answered && (selectedAnswer === index ? (isCorrect ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800') : (index === currentQuestion.correctAnswer ? 'bg-green-100 border-green-500 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-600')) || 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
            }`}
          >{option}</button>
        ))}
      </div>
      {answered && (
        <div className="mt-4">
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
            <h4 className={`font-medium mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{isCorrect ? 'Correct!' : 'Not quite'}</h4>
            <p className="text-gray-300 text-sm">{currentQuestion.explanation}</p>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleNext} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              {currentMCQIndex < mcqQuestions.length - 1 ? 'Next Question' : 'Start Coding'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
