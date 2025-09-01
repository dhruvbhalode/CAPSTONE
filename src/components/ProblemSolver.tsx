import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, Lightbulb, Eye, EyeOff } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useParams } from 'react-router-dom';
import { useProblem, Problem } from '../contexts/ProblemContext';
import { useAuth } from '../contexts/AuthContext';
import CodeEditor from './CodeEditor';
import MCQSection from './MCQSection';
import Timer from './Timer';
import OptimalSolution from './OptimalSolution';

export default function ProblemSolver() {
  const { problemId } = useParams<{ problemId: string }>();
  const { getProblemById, getMCQsForProblem } = useProblem();
  const { user, token, updateUser } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [phase, setPhase] = useState<'reading' | 'mcq' | 'coding' | 'completed'>('reading');
  const [showOptimalSolution, setShowOptimalSolution] = useState(false);
  
  useEffect(() => {
    if (problemId) {
      const currentProblem = getProblemById(problemId);
      setProblem(currentProblem || null);
    }
     // Reset state when problem changes
    setPhase('reading');
    setTimerRunning(false);
    setShowHint(false);
    setCurrentHintIndex(0);
    setShowOptimalSolution(false);
  }, [problemId, getProblemById]);

  const handleStartCoding = () => {
    setPhase('coding');
    setTimerRunning(true);
  };

  const handleComplete = useCallback(async (correct: boolean) => {
    if (!problem || !user) return;
    setTimerRunning(false);

    // 1. Send interaction to DKT server
    try {
      await fetch(`${import.meta.env.VITE_API_DKT_URL}/dkt/interaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user._id,
          problem_id: problem.id,
          skills: problem.tags,
          correct: correct
        }),
      });
    } catch (error) {
      console.error("Failed to send interaction to DKT service:", error);
    }

    // 2. Send interaction to Auth/User server to update stats
    try {
      const response = await fetch(`${import.meta.env.VITE_API_AUTH_URL}/api/user/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          problemId: problem.id,
          correct: correct
        }),
      });
      if(response.ok) {
        const data = await response.json();
        updateUser(data.user); // Update user in context
      }
    } catch (error) {
      console.error("Failed to update user stats:", error);
    }

    setPhase('completed');
    setShowOptimalSolution(true);
  }, [problem, user, token, updateUser]);

  const nextHint = () => {
    if (problem && currentHintIndex < problem.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    }
  };
  
  if (!problem) {
    return <div className="text-white p-8">Problem not found or still loading...</div>;
  }
  
  const mcqs = getMCQsForProblem(problem.id);

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Timer running={timerRunning} />
             <div className="text-sm text-gray-400">
              Phase: <span className="text-white capitalize">{phase}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Hint
            </button>
            {phase === 'completed' && (
              <button
                onClick={() => setShowOptimalSolution(!showOptimalSolution)}
                className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                {showOptimalSolution ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showOptimalSolution ? 'Hide Solution' : 'Show Solution'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showHint && (
        <div className="bg-yellow-900/20 border-b border-yellow-600/30 p-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-yellow-400 font-medium mb-2">Hint {currentHintIndex + 1}/{problem.hints.length}</h3>
              <p className="text-gray-300">{problem.hints[currentHintIndex]}</p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {currentHintIndex < problem.hints.length - 1 && (<button onClick={nextHint} className="text-yellow-400 hover:text-yellow-300 text-sm">Next</button>)}
              <button onClick={() => setShowHint(false)} className="text-gray-400 hover:text-gray-300">✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-gray-900 overflow-y-auto p-6">
                 <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {problem.tags.map((tag) => <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{tag}</span>)}
                  </div>
                </div>
                <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 mb-6 whitespace-pre-line">{problem.description}</p>
                </div>
                {phase === 'reading' && mcqs.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <button onClick={() => setPhase('mcq')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
                      Continue to Questions
                    </button>
                  </div>
                )}
                 {phase === 'reading' && mcqs.length === 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <button onClick={handleStartCoding} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg">
                      Start Coding Now
                    </button>
                  </div>
                )}
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-gray-600" />
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-gray-800">
              {showOptimalSolution && phase === 'completed' ? (
                <OptimalSolution problem={problem} onTryAgain={() => setPhase('coding')} />
              ) : (
                <CodeEditor onStartCoding={handleStartCoding} onComplete={handleComplete} phase={phase} />
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {phase === 'mcq' && (
        <div className="h-64 bg-gray-800 border-t border-gray-700 flex-shrink-0">
          <MCQSection problemId={problem.id} onComplete={handleStartCoding} />
        </div>
      )}
    </div>
  );
}
