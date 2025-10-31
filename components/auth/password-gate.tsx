'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  getAuthState,
  verifySharedPassword,
  checkNicknameAvailable,
  saveAuthState,
  authenticatePlayer,
  clearAuthState
} from '@/lib/firebase/auth';
import { createInactivePlayer, cleanupInactivePlayers } from '@/lib/firebase/players';
import { trackLogin } from '@/lib/firebase/analytics';
import { EyeOff, Eye } from 'lucide-react';
import debounce from 'lodash/debounce';

type AuthTab = 'new' | 'signin';
type NewUserStep = 'shared-password' | 'registration';

export function PasswordGate() {
  const [activeTab, setActiveTab] = useState<AuthTab>('new');
  const [newUserStep, setNewUserStep] = useState<NewUserStep>('shared-password');

  // Shared password state
  const [sharedPassword, setSharedPassword] = useState('');

  // Registration state
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nicknameError, setNicknameError] = useState('');

  // Sign in state
  const [signinNickname, setSigninNickname] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const authState = getAuthState();

  useEffect(() => {
    // Auto-select signin tab if user has logged in before
    if (authState.playerId) {
      setActiveTab('signin');
      setSigninNickname(authState.nickname || '');
    }
  }, [authState.playerId, authState.nickname]);

  // Shared password verification handler
  const handleSharedPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isValid = await verifySharedPassword(sharedPassword);
      if (isValid) {
        setNewUserStep('registration');
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (err) {
      setError('Error verifying password');
    } finally {
      setLoading(false);
    }
  };

  // Nickname validation with debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkNickname = useCallback(
    debounce(async (value: string) => {
      if (value.length < 3) return;

      const available = await checkNicknameAvailable(value);
      if (!available) {
        setNicknameError('This nickname is already taken');
      } else {
        setNicknameError('');
      }
    }, 500),
    []
  );

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setNicknameError('');

    if (value.length >= 3) {
      checkNickname(value);
    }
  };

  // Registration submit handler
  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (nicknameError) {
      setError('Please fix errors before continuing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean up old inactive players (don't block on this)
      cleanupInactivePlayers().catch(err => {
        console.warn('Cleanup failed (non-critical):', err);
      });

      // Final availability check
      const available = await checkNicknameAvailable(nickname);
      if (!available) {
        setError('Someone just took this nickname. Please choose another.');
        setLoading(false);
        return;
      }

      // Create inactive player
      const player = await createInactivePlayer(nickname, password);

      // Save auth state
      saveAuthState(player.id, nickname);

      await trackLogin();

      // Redirect to profile
      router.push('/profile');
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sign in handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const player = await authenticatePlayer(signinNickname, signinPassword);

      if (!player) {
        setError('Invalid nickname or password');
        setLoading(false);
        return;
      }

      // Save auth state
      saveAuthState(player.id, player.nickname);

      await trackLogin();

      // Redirect based on active status
      if (player.isActive) {
        router.push('/dashboard');
      } else {
        router.push('/profile');
      }
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Different user link handler
  const handleDifferentUser = () => {
    clearAuthState();
    setSigninNickname('');
    setSigninPassword('');
    setActiveTab('new');
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
            {newUserStep === 'shared-password' ? (
              <>
                <h2 className="text-2xl font-bold text-center mb-2">
                  Welcome to Office Ping Pong 🏓
                </h2>
                <p className="text-center text-gray-600 mb-6">
                  Enter the office password to get started
                </p>

                <form onSubmit={handleSharedPasswordSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="shared-password">Office Password</Label>
                    <div className="relative">
                      <Input
                        id="shared-password"
                        type={showPassword ? 'text' : 'password'}
                        value={sharedPassword}
                        onChange={(e) => setSharedPassword(e.target.value)}
                        placeholder="Enter shared password"
                        required
                        className="h-12"
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
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12"
                  >
                    {loading ? 'Verifying...' : 'Continue'}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center mb-2">
                  Create Your Account
                </h2>
                <p className="text-center text-gray-600 mb-6">
                  Choose a nickname and password
                </p>

                <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={handleNicknameChange}
                      placeholder="Enter a nickname"
                      required
                      minLength={3}
                      maxLength={20}
                      pattern="[a-zA-Z0-9_-]+"
                      className="h-12"
                    />
                    {nicknameError && (
                      <p className="mt-1 text-sm text-red-600">{nicknameError}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Create Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                        className="h-12"
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

                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="h-12"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !!nicknameError}
                    className="w-full h-12"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-center mb-2">
              Welcome Back 👋
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Sign in with your nickname and password
            </p>

            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <Label htmlFor="signin-nickname">Nickname</Label>
                <Input
                  id="signin-nickname"
                  value={signinNickname}
                  onChange={(e) => setSigninNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-12"
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              {authState.nickname && (
                <button
                  type="button"
                  onClick={handleDifferentUser}
                  className="w-full text-sm text-blue-600 hover:text-blue-700"
                >
                  Different user?
                </button>
              )}
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
