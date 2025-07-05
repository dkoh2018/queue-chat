'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function CalendarTestPage() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testCalendar = async () => {
    if (!user) {
      setResult('❌ Please sign in first');
      return;
    }

    setLoading(true);
    setResult('Testing Google Calendar connection...\n');
    
    try {
      // Get current session with provider tokens
      const { data: { session } } = await supabase.auth.getSession();
      
      // Log session info for debugging
      console.log('🔍 SESSION DEBUG INFO:');
      console.log('Has session:', !!session);
      console.log('Has provider_token:', !!session?.provider_token);
      console.log('Token length:', session?.provider_token?.length || 0);
      if (session?.provider_token) {
        console.log('FULL TOKEN (copy this entire line):');
        console.log(session.provider_token);
        console.log('TOKEN END ^^^');
      }
      
      const response = await fetch('/api/test/calendar-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          query: query || 'Get my upcoming calendar events from now',
          providerToken: session?.provider_token // Send token from frontend
        })
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`❌ Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTokens = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/test/check-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black">📅 Google Calendar Test</h1>
        
        {/* Auth Section */}
        <div className="bg-white p-6 border-2 border-black rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Authentication</h2>
          {user ? (
            <div className="space-y-3">
              <div className="text-black">
                ✅ Signed in as: {user.email}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-sm text-black">
                  <strong>⚠️ Calendar Permission Issue:</strong> You&apos;re signed in but don&apos;t have calendar access tokens.
                  This happens when you signed in before calendar permissions were configured.
                </p>
                <p className="text-sm text-black mt-2">
                  <strong>Solution:</strong> Sign out and sign in again to grant calendar permissions.
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  🚪 Sign Out & Refresh Permissions
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-sm text-black">
                  <strong>📅 Calendar Permissions:</strong> When you sign in, you&apos;ll be asked to grant calendar access.
                  Make sure to allow calendar permissions for this test to work.
                </p>
              </div>
              <button
                onClick={signInWithGoogle}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                🔐 Sign In with Google (Calendar Access)
              </button>
            </div>
          )}
        </div>

        {/* Test Section */}
        <div className="bg-white p-6 border-2 border-black rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Calendar Test</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-black">
              Test Query (optional):
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'show my upcoming events', 'what's my schedule from now?'"
              className="w-full p-3 border-2 border-black rounded-md text-black"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={testCalendar}
              disabled={!user || loading}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '⏳ Testing...' : '🧪 Test Calendar Connection'}
            </button>
            
            <button
              onClick={checkTokens}
              disabled={!user || loading}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Checking...' : '🔍 Check Tokens'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white p-6 border-2 border-black rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Results</h2>
          <textarea
            value={result}
            readOnly
            className="w-full h-96 p-4 border-2 border-black rounded-md font-mono text-sm bg-white text-black"
            placeholder="Test results will appear here..."
          />
          <button
            onClick={() => setResult('')}
            className="mt-2 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}