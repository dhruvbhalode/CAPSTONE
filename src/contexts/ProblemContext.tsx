import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Interfaces defining the shape of our data
interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  testCases: TestCase[];
  tags: string[];
  hints: string[];
}

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ProblemContextType {
  problems: Problem[];
  getProblemById: (id: string) => Problem | undefined;
  getMCQsForProblem: (id: string) => MCQQuestion[];
}

const ProblemContext = createContext<ProblemContextType | undefined>(undefined);

// A more extensive list of sample problems to make the app feel more complete
const allProblems: Problem[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    inputFormat: 'nums = [2,7,11,15], target = 9',
    outputFormat: '[0,1]',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    testCases: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
    tags: ['Array', 'Hash Table'],
    hints: ['Use a hash map to store numbers you have seen and their indices.', 'For each element, check if `target - element` exists in the map.'],
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    inputFormat: 's = "()[]{}"',
    outputFormat: 'true',
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only \'()[]{}\'.'],
    testCases: [{ input: 's = "()[]{}"', output: 'true' }, { input: 's = "(]"', output: 'false' }],
    tags: ['String', 'Stack'],
    hints: ['Use a stack to keep track of opening brackets.', 'When you encounter a closing bracket, check if the top of the stack is the matching opening bracket.'],
  },
  {
    id: '3',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list.',
    inputFormat: 'list1 = [1,2,4], list2 = [1,3,4]',
    outputFormat: '[1,1,2,3,4,4]',
    constraints: ['The number of nodes in both lists is in the range [0, 50].', '-100 <= Node.val <= 100'],
    testCases: [{ input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }],
    tags: ['Linked List', 'Recursion'],
    hints: ['Create a dummy node to serve as the starting point of the merged list.', 'Compare the heads of both lists and append the smaller one to your merged list.'],
  },
   {
    id: '4',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    inputFormat: 'n = 3',
    outputFormat: '3',
    constraints: ['1 <= n <= 45'],
    testCases: [{ input: 'n = 2', output: '2', explanation: "1. 1 step + 1 step\n2. 2 steps" }, { input: 'n = 3', output: '3', explanation: "1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step" }],
    tags: ['Dynamic Programming', 'Math'],
    hints: ['This problem has an optimal substructure, which is a sign of dynamic programming.', 'The number of ways to reach step n is the sum of ways to reach step n-1 and n-2.'],
  }
];

const allMCQs: { [problemId: string]: MCQQuestion[] } = {
  '1': [
    { id: '1-1', question: 'What is the most suitable data structure for solving the Two Sum problem efficiently?', options: ['Array', 'Linked List', 'Hash Table', 'Stack'], correctAnswer: 2, explanation: 'A Hash Table provides O(1) average time complexity for lookups, making it ideal.' },
    { id: '1-2', question: 'What is the time complexity of the optimal solution?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], correctAnswer: 2, explanation: 'Using a hash table allows for a single pass through the array, resulting in O(n) time complexity.' }
  ],
  '2': [
    { id: '2-1', question: 'Which data structure is ideal for checking matching pairs of parentheses?', options: ['Queue', 'Stack', 'Hash Table', 'Tree'], correctAnswer: 1, explanation: 'A Stack is perfect due to its Last-In, First-Out (LIFO) nature, which matches how parentheses are nested.' },
  ]
};


export function ProblemProvider({ children }: { children: ReactNode }) {
  const [problems] = useState<Problem[]>(allProblems);

  // Fetch problems from your backend here
  // useEffect(() => {
  //   const fetchProblems = async () => {
  //     // const response = await fetch(`${import.meta.env.VITE_API_AUTH_URL}/api/problems`);
  //     // const data = await response.json();
  //     // setProblems(data);
  //   };
  //   fetchProblems();
  // }, []);

  const getProblemById = (id: string) => {
    return problems.find(p => p.id === id);
  };

  const getMCQsForProblem = (id: string) => {
    return allMCQs[id] || [];
  };

  return (
    <ProblemContext.Provider value={{ problems, getProblemById, getMCQsForProblem }}>
      {children}
    </ProblemContext.Provider>
  );
}

export function useProblem() {
  const context = useContext(ProblemContext);
  if (context === undefined) {
    throw new Error('useProblem must be used within a ProblemProvider');
  }
  return context;
}
