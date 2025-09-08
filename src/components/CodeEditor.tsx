import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ExternalLink } from 'lucide-react';
import { useProblem } from '../contexts/ProblemContext';

interface CodeEditorProps {
  phase: string;
}

export default function CodeEditor({ phase }: CodeEditorProps) {
  const { currentProblem } = useProblem();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');

  const getStarterCode = (lang: string) => {
    switch (lang) {
      case 'python': return `def solve(params):\n    # Your code here\n    pass`;
      case 'javascript': return `function solve(params) {\n    // Your code here\n}`;
      default: return '';
    }
  };
  
  useEffect(() => {
    setCode(getStarterCode(language));
  }, [currentProblem, language]);

  const handleExportToLeetCode = () => {
    if (currentProblem?.leetcodeUrl) {
      window.open(currentProblem.leetcodeUrl, '_blank');
    } else {
      alert("No LeetCode link available for this problem.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="bg-gray-700 p-2 border-b border-gray-600 flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded" title="Run Code (Simulation)">
                <Play className="h-4 w-4 text-white" />
            </button>
            <button onClick={() => setCode(getStarterCode(language))} className="p-2 bg-gray-600 hover:bg-gray-500 rounded" title="Reset Code">
                <RotateCcw className="h-4 w-4 text-white" />
            </button>
            <button onClick={handleExportToLeetCode} className="p-2 bg-orange-600 hover:bg-orange-700 rounded" title="View on LeetCode">
                <ExternalLink className="h-4 w-4 text-white" />
            </button>
        </div>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-gray-600 text-white text-sm rounded px-2 py-1">
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-full flex-1 p-4 bg-[#1e1e1e] text-gray-100 font-mono text-sm resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
