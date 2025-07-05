'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function CalendarTestPage() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [maxResults, setMaxResults] = useState(50);
  const [timeMinDays, setTimeMinDays] = useState(0);
  const [timeMaxDays, setTimeMaxDays] = useState(300);

  // Test direct API parameters - this is the only method that works
  const testApiParameters = async () => {
    if (!user) {
      setResult('❌ Please sign in first');
      return;
    }

    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        setResult('❌ No session token found. Please sign out and sign in again.');
        return;
      }

      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setDate(now.getDate() + timeMinDays);
      
      const timeMax = new Date(now);
      timeMax.setDate(now.getDate() + timeMaxDays);

      setResult(`🧪 Testing API Parameters...\n⚙️ maxResults: ${maxResults}\n📅 timeMin: ${timeMin.toISOString()}\n📅 timeMax: ${timeMax.toISOString()}\n\n`);
      
      // Make direct API call to Google Calendar
      const params = new URLSearchParams({
        orderBy: 'startTime',
        singleEvents: 'true',
        maxResults: maxResults.toString(),
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session.provider_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        setResult(`❌ Direct API call failed: ${response.status} ${response.statusText}\n${errorText}`);
        return;
      }

      const data = await response.json();
      
      let formattedResult = `📅 CALENDAR API TEST RESULTS\n`;
      formattedResult += `⚙️ Requested maxResults: ${maxResults}\n`;
      formattedResult += `📊 Actual events returned: ${data.items?.length || 0}\n`;
      formattedResult += `📅 Time range: ${timeMin.toLocaleDateString()} to ${timeMax.toLocaleDateString()}\n`;
      formattedResult += `🔗 API URL: https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}\n\n`;
      
      if (data.nextPageToken) {
        formattedResult += `📄 Has nextPageToken: ${data.nextPageToken}\n`;
        formattedResult += `💡 This means there are more events available via pagination!\n\n`;
      }
      
      formattedResult += `📋 Raw Response:\n${JSON.stringify(data, null, 2)}`;
      
      setResult(formattedResult);
    } catch (err) {
      setResult(`❌ Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Quick test with different maxResults values
  const runQuickTest = async () => {
    if (!user) {
      setResult('❌ Please sign in first');
      return;
    }

    setLoading(true);
    setResult('🧪 Running Quick Test Suite...\n\n');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        setResult('❌ No session token found. Please sign out and sign in again.');
        return;
      }

      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + (300 * 24 * 60 * 60 * 1000)).toISOString();
      
      const testCounts = [10, 25, 50, 100];
      let allResults = '🧪 QUICK TEST RESULTS\n\n';
      
      for (const count of testCounts) {
        allResults += `Testing maxResults=${count}...\n`;
        setResult(allResults);
        
        const params = new URLSearchParams({
          orderBy: 'startTime',
          singleEvents: 'true',
          maxResults: count.toString(),
          timeMin: timeMin,
          timeMax: timeMax,
        });

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${session.provider_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          allResults += `✅ ${count} requested → ${data.items?.length || 0} returned\n`;
        } else {
          allResults += `❌ ${count} failed: ${response.status}\n`;
        }
        
        setResult(allResults);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      allResults += '\n🎉 Quick test complete!\n';
      setResult(allResults);
    } catch (err) {
      setResult(`❌ Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black">📅 Calendar API Testing</h1>
        
        {/* Current Time Display */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2 text-black">⏰ Current Time</h2>
          <p className="text-black">{new Date().toLocaleString()}</p>
        </div>

        {/* Auth Section */}
        <div className="bg-white p-6 border-2 border-black rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Authentication</h2>
          {user ? (
            <div className="flex items-center justify-between">
              <span className="text-black">✅ Signed in as: {user.email}</span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                🚪 Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-sm text-black">
                  <strong>📅 Calendar Access Required:</strong> Sign in to test calendar functionality.
                </p>
              </div>
              <button
                onClick={signInWithGoogle}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                🔐 Sign In with Google Calendar
              </button>
            </div>
          )}
        </div>

        {/* Main Testing Section */}
        <div className="bg-white border-2 border-black rounded-lg mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-black mb-4">⚙️ Direct API Testing</h3>
            <p className="text-gray-600 mb-6">
              Test Google Calendar API directly with different parameters. This is the only method that works reliably.
            </p>
            
            {/* Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Max Results:
                </label>
                <select
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="w-full p-2 border-2 border-black rounded text-black"
                >
                  <option value={10}>10 events</option>
                  <option value={25}>25 events</option>
                  <option value={50}>50 events</option>
                  <option value={100}>100 events</option>
                  <option value={250}>250 events</option>
                  <option value={500}>500 events</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Start (days from now):
                </label>
                <input
                  type="number"
                  value={timeMinDays}
                  onChange={(e) => setTimeMinDays(Number(e.target.value))}
                  className="w-full p-2 border-2 border-black rounded text-black"
                  min="-365"
                  max="365"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  End (days from now):
                </label>
                <input
                  type="number"
                  value={timeMaxDays}
                  onChange={(e) => setTimeMaxDays(Number(e.target.value))}
                  className="w-full p-2 border-2 border-black rounded text-black"
                  min="-365"
                  max="365"
                />
              </div>
            </div>
            
            {/* Test Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => testApiParameters()}
                disabled={!user || loading}
                className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '⏳ Testing...' : '🧪 Test API Call'}
              </button>
              
              <button
                onClick={() => runQuickTest()}
                disabled={!user || loading}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '⏳ Running Tests...' : '🚀 Quick Test (10,25,50,100)'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white p-6 border-2 border-black rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Test Results</h2>
          <textarea
            value={result}
            readOnly
            className="w-full h-96 p-4 border-2 border-black rounded-md font-mono text-sm bg-white text-black"
            placeholder="Test results will appear here..."
          />
          <div className="mt-2 flex space-x-2">
            <button
              onClick={() => setResult('')}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Clear Results
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Copy Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}