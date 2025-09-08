import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, CheckCircle } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useProblem } from '../contexts/ProblemContext';
import { useAuth } from '../contexts/AuthContext';
import CodeEditor from './CodeEditor';
import MCQSection from './MCQSection';
import Timer from './Timer';
import OptimalSolution from './OptimalSolution';

const API_URL = 'http://localhost:5001';

export default function ProblemSolver() {
  const { problemId } = useParams<{ problemId: string }>();
  const { user } = useAuth();
  const { currentProblem, fetchProblem, loading, error } = useProblem();

  const [phase, setPhase] = useState<'reading' | 'mcq' | 'coding' | 'completed'>('reading');
  const [timerRunning, setTimerRunning] = useState(false);
  const [solutionWorked, setSolutionWorked] = useState<boolean | null>(null);

  useEffect(() => {
    if (problemId) {
      fetchProblem(problemId);
      // Reset state when a new problem is loaded
      setPhase('reading');
      setSolutionWorked(null);
      setTimerRunning(false);
    }
  }, [problemId]);

  const recordInteraction = (data: object) => {
    if (!user || !problemId || !currentProblem) return;
    const interactionData = {
      userId: user._id,
      problemId,
      skills: currentProblem.tags,
      ...data,
    };
    fetch(`${API_URL}/api/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interactionData),
    }).catch(err => console.error("Failed to record interaction:", err));
  };

  const handleMCQComplete = (score: number) => {
    recordInteraction({ phase: 'mcq', correct: score >= 80, mcqScore: score });
    setPhase('coding');
    setTimerRunning(true);
  };

  const handleCodingComplete = () => {
    setPhase('completed');
    setTimerRunning(false);
  };

  const handleSolutionFeedback = (worked: boolean) => {
    setSolutionWorked(worked);
    recordInteraction({ phase: 'completed', correct: worked });
  };
  
  const handleTryAgain = () => {
    setPhase('reading');
    setSolutionWorked(null);
    setTimerRunning(false);
  };

  if (loading) return <div className="p-8 text-white">Loading Problem...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!currentProblem) return <div className="p-8 text-white">Problem not found.</div>;

  return (
    <div className="h-[calc(100vh-68px)] flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Timer running={timerRunning} />
          <div className="text-sm text-gray-400">Phase: <span className="text-white capitalize">{phase}</span></div>
          {phase === 'coding' && (
            <button onClick={handleCodingComplete} className="flex items-center px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md">
              <CheckCircle className="h-4 w-4 mr-2" /> Submit & Compare
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={50} minSize={30} className="overflow-y-auto p-6">
            <h1 className="text-2xl font-bold text-white mb-2">{currentProblem.title}</h1>
            <p className="text-gray-300 whitespace-pre-line">{currentProblem.description}</p>
            {phase === 'reading' && (
              <button onClick={() => setPhase('mcq')} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
                Continue to Questions
              </button>
            )}
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-blue-600" />
          <Panel defaultSize={50} minSize={30}>
            {phase === 'completed' ? (
              <OptimalSolution 
                problem={currentProblem} 
                onSolutionFeedback={handleSolutionFeedback} 
                solutionWorked={solutionWorked}
                onTryAgain={handleTryAgain}
              />
            ) : (
              <CodeEditor phase={phase} />
            )}
          </Panel>
        </PanelGroup>
      </div>

      {phase === 'mcq' && (
        <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0">
          <MCQSection onComplete={handleMCQComplete} />
        </div>
      )}
    </div>
  );
}