'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import bcrypt from 'bcryptjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SetupPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'creating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const setupPassword = async () => {
    try {
      setStatus('checking');
      setMessage('Checking if password is already set...');

      // Check if config already exists
      const configSnapshot = await getDocs(collection(db, 'config'));
      if (!configSnapshot.empty) {
        setStatus('success');
        setMessage('✅ Password is already configured! You can delete this page.');
        return;
      }

      setStatus('creating');
      setMessage('Creating password configuration...');

      const password = process.env.NEXT_PUBLIC_SHARED_PASSWORD || 'kipisthebest';
      const hashedPassword = await bcrypt.hash(password, 10);

      await addDoc(collection(db, 'config'), {
        sharedPasswordHash: hashedPassword,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStatus('success');
      setMessage(`✅ Password configured successfully! Office password: "${password}"`);
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${(error as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Setup Office Password</h1>
          <p className="text-gray-600">
            This is a one-time setup page to configure the shared office password in Firestore.
          </p>
        </div>

        <div className="space-y-4">
          {status === 'idle' && (
            <Button onClick={setupPassword} className="w-full">
              Setup Password
            </Button>
          )}

          {(status === 'checking' || status === 'creating') && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 whitespace-pre-line">{message}</p>
              <p className="text-sm text-green-700 mt-4">
                You can now delete the <code className="bg-green-100 px-1 py-0.5 rounded">app/setup-password</code> directory.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{message}</p>
              <Button onClick={setupPassword} className="w-full mt-4">
                Try Again
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p><strong>What this does:</strong></p>
          <p>• Creates a document in the <code>config</code> collection</p>
          <p>• Stores the bcrypt hash of your office password</p>
          <p>• Uses the password from NEXT_PUBLIC_SHARED_PASSWORD env var</p>
        </div>
      </Card>
    </div>
  );
}
