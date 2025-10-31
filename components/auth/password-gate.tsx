'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getAuthState } from '@/lib/firebase/auth';
import { trackLogin } from '@/lib/firebase/analytics';
import { EyeOff, Eye } from 'lucide-react';

type AuthTab = 'new' | 'signin';

export function PasswordGate() {
  const [activeTab, setActiveTab] = useState<AuthTab>('new');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const authState = getAuthState();

  useEffect(() => {
    // Auto-select signin tab if user has logged in before
    if (authState.playerId) {
      setActiveTab('signin');
    }
  }, [authState.playerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isValid = await verifyPassword(password);

      if (isValid) {
        saveSession();
        await trackLogin();
        router.push('/dashboard');
      } else {
        setError('Incorrect Password. Please try again.');
      }
    } catch (err) {
      setError('Error verifying password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏓</div>
          <h1 className="text-3xl font-bold mb-2">Office Pong</h1>
          <p className="text-gray-600">Welcome! Enter the shared password to join.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            New User
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'signin'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
        </div>

        {activeTab === 'new' ? (
          <div>
            <p className="text-center mb-4">New User Flow - Coming in Task 9</p>
          </div>
        ) : (
          <div>
            <p className="text-center mb-4">Sign In Flow - Coming in Task 10</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" style={{display: 'none'}}>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? 'border-red-500' : ''}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={loading || !password}
          >
            {loading ? 'Verifying...' : 'Enter'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
