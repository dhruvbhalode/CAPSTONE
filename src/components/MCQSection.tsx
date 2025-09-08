import React, { useState, useEffect } from 'react';
import { ArrowRight, Brain } from 'lucide-react';
import { useProblem } from '../contexts/ProblemContext';

interface MCQSectionProps {
  onComplete: (score: number) => void;
}

export default function MCQSection({ onComplete }: MCQSectionProps) {
  const { currentProblem, currentMCQIndex, nextMCQ } = useProblem();
  
  // Safely get mcqQuestions, defaulting to an empty array
  const mcqQuestions = currentProblem?.mcqQuestions || [];
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Get the current question, which might be undefined temporarily
  const currentQuestion = mcqQuestions[currentMCQIndex];

  // Reset state when the question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
  }, [currentMCQIndex]);

  // Safety Check: If there's no question yet, don't render the component content
  if (!currentQuestion) {
    // This can happen briefly while data loads or if a problem has no MCQs
    return <div className="p-6 text-gray-400">Loading questions...</div>;
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return;
    
    setSelectedAnswer(answerIndex);
    setAnswered(true);
    if (answerIndex === currentQuestion.correctAnswer) {
      setCorrectAnswersCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    // Check if there are more questions
    if (currentMCQIndex < mcqQuestions.length - 1) {
      nextMCQ();
    } else {
      // Last question, calculate final score and complete
      const finalScore = mcqQuestions.length > 0
        ? Math.round((correctAnswersCount / mcqQuestions.length) * 100)
        : 100; // If no questions, score 100
      onComplete(finalScore);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <h3 className="text-lg font-bold text-white flex items-center mb-4">
        <Brain className="h-5 w-5 text-blue-400 mr-2" />
        Understanding Check ({currentMCQIndex + 1}/{mcqQuestions.length})
      </h3>
      
      <p className="text-gray-300 mb-4">{currentQuestion.question}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={answered}
            className={`p-3 text-left rounded-lg border transition-colors ${
              answered && (index === selectedAnswer || index === currentQuestion.correctAnswer)
                ? index === currentQuestion.correctAnswer
                  ? 'bg-green-900/50 border-green-500' // Correct answer
                  : 'bg-red-900/50 border-red-500' // Incorrectly selected
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {answered && (
        <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-400">{currentQuestion.explanation}</p>
            <button onClick={handleNext} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              {currentMCQIndex < mcqQuestions.length - 1 ? 'Next' : 'Start Coding'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
        </div>
      )}
    </div>
  );
}
