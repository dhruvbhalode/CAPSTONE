import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Problem from './models/Problem.js';

dotenv.config();

const problems = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    inputFormat: 'nums = [2,7,11,15], target = 9',
    outputFormat: '[0,1]',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      'Only one valid answer exists.'
    ],
    tags: ['Array', 'Hash Table'],
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
    optimalSolution: `def twoSum(self, nums, target):
    numMap = {}
    n = len(nums)
    for i in range(n):
        complement = target - nums[i]
        if complement in numMap:
            return [numMap[complement], i]
        numMap[nums[i]] = i
    return []`,
    mcqQuestions: [
      {
        question: 'What is the most efficient data structure for solving the Two Sum problem?',
        options: ['Array', 'Linked List', 'Hash Table', 'Stack'],
        correctAnswer: 2,
        explanation: 'A Hash Table (or Dictionary) provides O(1) average time complexity for lookups, making it ideal for finding the complement of each number.',
        category: 'data-structure'
      },
      {
        question: 'What is the time complexity of the optimal single-pass hash map solution?',
        options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'],
        correctAnswer: 2,
        explanation: 'By iterating through the array once and using a hash map for lookups, the overall time complexity is O(n).',
        category: 'algorithm'
      }
    ]
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.`,
    inputFormat: 's = "()[]{}"',
    outputFormat: 'true',
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only \'()[]{}\'.'],
    tags: ['String', 'Stack'],
    leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/',
    optimalSolution: `def isValid(self, s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack`,
    mcqQuestions: [
      {
        question: 'Which data structure is best suited for checking matching parentheses?',
        options: ['Queue', 'Stack', 'Hash Table', 'Array'],
        correctAnswer: 1,
        explanation: 'A Stack is perfect for this problem due to its Last-In, First-Out (LIFO) nature, which matches how parentheses must be nested and closed.',
        category: 'data-structure'
      }
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    await Problem.deleteMany({});
    console.log('Cleared existing problems.');

    await Problem.insertMany(problems);
    console.log('Database seeded successfully! 🌱');

  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDB();
