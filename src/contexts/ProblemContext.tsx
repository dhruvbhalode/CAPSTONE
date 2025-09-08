import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Interfaces matching backend models
interface MCQQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Problem {
  _id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  tags: string[];
  hints: string[];
  optimalSolution?: string;
  mcqQuestions: MCQQuestion[];
  leetcodeUrl?: string;
}

interface ProblemContextType {
  currentProblem: Problem | null;
  loading: boolean;
  error: string | null;
  fetchProblem: (problemId: string) => Promise<void>;
  currentMCQIndex: number;
  nextMCQ: () => void;
}

const ProblemContext = createContext<ProblemContextType | undefined>(undefined);
const API_URL = 'http://localhost:5001';

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);

  const fetchProblem = useCallback(async (problemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/problems/${problemId}`);
      if (!response.ok) throw new Error('Failed to fetch problem');
      const data = await response.json();
      setCurrentProblem(data);
      setCurrentMCQIndex(0); // Reset for new problem
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const nextMCQ = () => {
    if (currentProblem) {
      setCurrentMCQIndex(prev => Math.min(prev + 1, currentProblem.mcqQuestions.length));
    }
  };

  return (
    <ProblemContext.Provider value={{ currentProblem, loading, error, fetchProblem, currentMCQIndex, nextMCQ }}>
      {children}
    </ProblemContext.Provider>
  );
}

export function useProblem() {
  const context = useContext(ProblemContext);
  if (!context) throw new Error('useProblem must be used within a ProblemProvider');
  return context;
}
