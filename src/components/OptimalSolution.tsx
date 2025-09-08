import React from 'react';
import { CheckCircle, XCircle, Code2, BookOpen, RotateCcw } from 'lucide-react';

interface Problem {
  title: string;
  optimalSolution?: string;
}

interface OptimalSolutionProps {
  problem: Problem;
  onSolutionFeedback: (worked: boolean) => void;
  solutionWorked: boolean | null;
  onTryAgain: () => void;
}

export default function OptimalSolution({ problem, onSolutionFeedback, solutionWorked, onTryAgain }: OptimalSolutionProps) {
  return (
    <div className="h-full flex flex-col bg-gray-800 p-4 overflow-y-auto">
      <div className="flex items-center space-x-2 mb-4">
        <BookOpen className="h-5 w-5 text-green-400" />
        <span className="text-white font-medium">Reflection & Analysis</span>
      </div>

      {solutionWorked === null && (
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3 mb-4">
          <h3 className="text-blue-300 font-medium mb-2">Did your solution pass?</h3>
          <div className="flex space-x-3">
            <button onClick={() => onSolutionFeedback(true)} className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded">
              <CheckCircle className="h-4 w-4 mr-2" /> Yes
            </button>
            <button onClick={() => onSolutionFeedback(false)} className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded">
              <XCircle className="h-4 w-4 mr-2" /> No
            </button>
          </div>
        </div>
      )}

      {solutionWorked === false && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 mb-4 flex justify-between items-center">
          <span className="text-red-300 font-medium">Study the optimal solution below.</span>
          <button onClick={onTryAgain} className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded">
            <RotateCcw className="h-4 w-4 mr-2" /> Try Again
          </button>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Optimal Implementation (Python)
        </h3>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
          <pre className="text-gray-100 font-mono text-sm overflow-x-auto">
            <code>{problem.optimalSolution || '// No optimal solution provided.'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}