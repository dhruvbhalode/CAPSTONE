import React, { useState, useEffect } from 'react';
import { Trophy, Target, Clock, Brain, Zap, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5001';

// Interfaces for the fetched data
interface Problem {
  _id: string;
  title: string;
  difficulty: string;
  skills: string[];
}

interface Analytics {
  skillMastery?: { [key: string]: number };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<Problem[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<Problem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch recommendations, solved problems, and analytics concurrently
          const [recsResponse, solvedResponse, analyticsResponse] = await Promise.all([
            fetch(`${API_URL}/api/recommendations/${user._id}`),
            fetch(`${API_URL}/api/users/${user._id}/solved-problems`),
            fetch(`${API_URL}/api/analytics/${user._id}`)
          ]);

          if (!recsResponse.ok || !solvedResponse.ok || !analyticsResponse.ok) {
            throw new Error('Failed to fetch dashboard data');
          }

          const recsData = await recsResponse.json();
          const solvedData = await solvedResponse.json();
          const analyticsData = await analyticsResponse.json();

          setRecommendations(recsData);
          setSolvedProblems(solvedData);
          setAnalytics(analyticsData);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const getSkillAreas = (min: number, max: number, descending: boolean) => {
    const skillMastery = analytics?.skillMastery || {};
    return Object.entries(skillMastery)
      .filter(([, score]) => score >= min && score <= max)
      .sort(([, a], [, b]) => (descending ? b - a : a - b))
      .slice(0, 3)
      .map(([topic, score]) => ({ topic, score: Math.round(score * 100) }));
  };

  const strongAreas = getSkillAreas(0.8, 1.0, true);
  const weakAreas = getSkillAreas(0.0, 0.6, false);

  if (loading) {
    return <div className="text-white text-center p-10">Loading Dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Welcome and Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-blue-100 text-lg">Ready to optimize your coding skills today?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Problems Solved" value={user?.solvedProblems || 0} icon={Trophy} color="text-yellow-400" />
        <StatCard label="Accuracy Rate" value={`${user?.accuracy || 0}%`} icon={Target} color="text-green-400" />
        <StatCard label="Avg. Time" value="-" icon={Clock} color="text-blue-400" />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended Problems Section */}
          <ProblemList title="Recommended For You" icon={Brain} problems={recommendations} navigate={navigate} emptyText="No new recommendations. Great job!" />

          {/* Solved Problems Section */}
          <ProblemList title="Practice History" icon={History} problems={solvedProblems} navigate={navigate} emptyText="You haven't solved any problems yet." isSolvedList />
        </div>

        {/* Performance Insights Section */}
        <div className="space-y-6">
          <PerformanceArea title="Areas to Improve" icon={Target} areas={weakAreas} color="red" />
          <PerformanceArea title="Strong Areas" icon={Zap} areas={strongAreas} color="green" />
        </div>
      </div>
    </div>
  );
}

// Reusable component for displaying a list of problems
const ProblemList = ({ title, icon: Icon, problems, navigate, emptyText, isSolvedList = false }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <h2 className="text-xl font-bold text-white flex items-center mb-6">
      <Icon className="h-6 w-6 text-blue-400 mr-2" />
      {title}
    </h2>
    <div className="space-y-4">
      {problems.length > 0 ? (
        problems.map((problem) => (
          <div key={problem._id} className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer" onClick={() => navigate(`/solve/${problem._id}`)}>
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${isSolvedList ? 'text-green-400' : 'text-white'}`}>{problem.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                problem.difficulty === 'Easy' ? 'bg-green-900 text-green-300' :
                problem.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>
                {problem.difficulty}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-400">{emptyText}</p>
      )}
    </div>
  </div>
);

// StatCard and PerformanceArea components remain the same
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <Icon className={`h-8 w-8 ${color}`} />
    </div>
  </div>
);

const PerformanceArea = ({ title, icon: Icon, areas, color }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <h3 className={`text-lg font-bold text-white mb-4 flex items-center`}>
      <Icon className={`h-5 w-5 mr-2 text-${color}-400`} />
      {title}
    </h3>
    <div className="space-y-3">
      {areas.length > 0 ? areas.map(area => (
        <div key={area.topic}>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="text-gray-300">{area.topic}</span>
            <span className="text-white">{area.score}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className={`bg-${color}-500 h-2 rounded-full`} style={{ width: `${area.score}%` }}></div>
          </div>
        </div>
      )) : <p className="text-sm text-gray-500">Not enough data yet.</p>}
    </div>
  </div>
);
