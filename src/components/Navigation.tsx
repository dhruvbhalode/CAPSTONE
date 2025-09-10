import React from 'react';
import { Code2, LogOut, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="flex items-center">
            <Code2 className="h-8 w-8 text-blue-400 mr-3" />
            <span className="text-xl font-bold text-white">CodeOptimizer</span>
          </Link>
          <div className="flex space-x-2">
             <Link
              to="/dashboard"
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname.startsWith('/dashboard') 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img src={user?.avatar} alt={user?.name} className="h-8 w-8 rounded-full" />
            <div className="text-sm">
              <div className="text-white font-medium">{user?.name}</div>
              <div className="text-gray-400 capitalize">{user?.experience}</div>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><LogOut className="h-5 w-5" /></button>
        </div>
      </div>
    </nav>
  );
}
