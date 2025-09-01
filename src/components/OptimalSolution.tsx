import React from 'react';
import { Code2, BookOpen, Lightbulb, RotateCcw } from 'lucide-react';
import { Problem } from '../contexts/ProblemContext';

interface OptimalSolutionProps {
  problem: Problem;
  onTryAgain: () => void;
}

export default function OptimalSolution({ problem, onTryAgain }: OptimalSolutionProps) {
  
  const optimalSolutionCode = `// Optimal Solution in Python using Hash Map
// Time Complexity: O(n)
// Space Complexity: O(n)

def two_sum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []
  `;

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="bg-gray-700 p-4 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-green-400" />
            <span className="text-white font-medium">Optimal Solution Review</span>
          </div>
          <button
            onClick={onTryAgain}
            className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />Key Insights</h3>
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 text-gray-300 space-y-2">
              <p>The hash map approach reduces time complexity from O(n²) to O(n) by trading space for time. This is a common and powerful pattern.</p>
              <p>By storing each number and its index as we iterate, we can check if the required complement (`target - current_number`) has been seen before in O(1) time.</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><Code2 className="h-5 w-5 text-blue-400 mr-2" />Optimal Implementation</h3>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
            <pre className="text-gray-100 font-mono text-sm overflow-x-auto">
              <code>{optimalSolutionCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
