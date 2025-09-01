import React, { useState } from 'react';
import { Play, RotateCcw, Code2, Check, X } from 'lucide-react';

interface CodeEditorProps {
  onStartCoding: () => void;
  onComplete: (correct: boolean) => void;
  phase: 'reading' | 'mcq' | 'coding' | 'completed';
}

export default function CodeEditor({ onStartCoding, onComplete, phase }: CodeEditorProps) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(`# Write your solution here...`);

  const handleRunCode = () => {
    if (phase === 'reading' || phase === 'mcq') {
      onStartCoding();
    } else {
        // In a real implementation, this would execute the code against test cases
      console.log('Running code:', code);
      alert("Code execution simulation complete. Now, please submit whether your solution was correct or incorrect.");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-700 p-3 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2"><Code2 className="h-4 w-4 text-blue-400" /><span className="text-white font-medium">Code Editor</span></div>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500">
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
          placeholder="Write your solution here..."
          spellCheck={false}
          disabled={phase !== 'coding'}
        />
        {(phase !== 'coding') && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center">
                 <button
                    onClick={onStartCoding}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-lg rounded-lg transition-colors font-bold"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Coding Session
                </button>
            </div>
        )}
      </div>

      <div className="bg-gray-700 p-2 border-t border-gray-600 flex items-center justify-end space-x-2">
        <button onClick={() => setCode('')} className="flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"><RotateCcw className="h-3 w-3 mr-1" />Reset</button>
        <button onClick={handleRunCode} className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"><Play className="h-3 w-3 mr-1" />Run Code</button>
        <button onClick={() => onComplete(true)} className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"><Check className="h-4 w-4 mr-1" />Submit Correct</button>
        <button onClick={() => onComplete(false)} className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"><X className="h-4 w-4 mr-1" />Submit Incorrect</button>
      </div>
    </div>
  );
}
