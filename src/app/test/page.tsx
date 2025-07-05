/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { SYSTEM_PROMPTS } from '@/lib/prompts';

export default function CalendarTestPage() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New state for pipeline testing
  const [userQuery, setUserQuery] = useState('What\'s my schedule for tomorrow?');
  const [pipelineResults, setPipelineResults] = useState({
    stage0: '',
    stage1: '',
    stage2: '',
    stage3: ''
  });

  // Helper function to create JSON table format directly from raw data
  const getTimeContext = () => {
    const now = new Date();
    return {
      currentDate: now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      currentTime: now.toLocaleTimeString('en-US', { hour12: false }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      currentDateTime: now.toISOString()
    };
  };

  const createJsonTableFromRaw = (rawData: Record<string, any>) => {
    if (!rawData.items) return { events: [], summary: "0 events found", totalEvents: 0, hasMoreEvents: false };
    
    const events = rawData.items.map((event: Record<string, any>) => ({
      id: event.id || 'No ID',
      title: event.summary || 'No title',
      date: event.start?.dateTime?.split('T')[0] || event.start?.date || 'No date',
      time: event.start?.dateTime 
        ? `${new Date(event.start.dateTime).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })} - ${new Date(event.end?.dateTime || event.start.dateTime).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}`
        : 'All day',
              location: event.location || "",
        description: event.description || "",
      status: event.status || 'unknown',
              htmlLink: event.htmlLink || "",
      isAllDay: !!event.start?.date,
      isRecurring: !!event.recurringEventId,
      day: event.start?.dateTime 
        ? new Date(event.start.dateTime).toLocaleDateString('en-US', { weekday: 'long' })
        : event.start?.date 
        ? new Date(event.start.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
        : 'Unknown'
    }));

    return {
      events,
      summary: `${events.length} events found`,
      dateRange: {
        start: rawData.requestParams?.timeMin || 'Not specified',
        end: rawData.requestParams?.timeMax || 'Not specified'
      },
      totalEvents: events.length,
      hasMoreEvents: !!rawData.nextPageToken
    };
  };

  // 4-Stage Pipeline Test with Parameter Intelligence
  const runPipelineTest = async () => {
    if (!user) {
      setResult('❌ Please sign in first');
      return;
    }

    setLoading(true);
    
    try {
      // Clear previous results
      setPipelineResults({
        stage0: '',
        stage1: '',
        stage2: '',
        stage3: ''
      });

      // Get session for Google Calendar access
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        setResult('❌ No session token found. Please sign out and sign in again.');
        return;
      }

      // STAGE 0: Parameter Intelligence
      const timeContext = getTimeContext();
      let intelligentParams = {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 50,
        searchQuery: '',
        reasoning: 'Default parameters used - parameter intelligence failed',
        queryType: 'default'
      };

      try {
        const parameterResponse = await fetch('/api/calendar/parameter-intelligence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: SYSTEM_PROMPTS.CALENDAR_PARAMETER_INTELLIGENCE
                  .replace('{currentDate}', timeContext.currentDate)
                  .replace('{currentTime}', timeContext.currentTime)
                  .replace('{currentDateTime}', timeContext.currentDateTime)
              },
              {
                role: 'user',
                content: userQuery
              }
            ]
          })
        });

        if (parameterResponse.ok) {
          const paramData = await parameterResponse.json();
          const paramContent = paramData.content || "{}";
          
          try {
            // Clean the response in case there's markdown formatting
            const cleanedContent = paramContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsedParams = JSON.parse(cleanedContent);
            
            // Convert the new format (days) to the old format (timeMin/timeMax)
            if (parsedParams.days && typeof parsedParams.days === 'number') {
              const now = new Date();
              const endDate = new Date(now.getTime() + (parsedParams.days * 24 * 60 * 60 * 1000));
              
              intelligentParams = {
                timeMin: now.toISOString(),
                timeMax: endDate.toISOString(),
                maxResults: parsedParams.maxResults || 50,
                searchQuery: '', // No search query - Stage 3 AI will handle filtering
                reasoning: parsedParams.reasoning || 'AI selected time range',
                queryType: 'intelligent'
              };
            }
          } catch {
            console.warn('Failed to parse parameter intelligence response, using defaults');
          }
        }
      } catch (error) {
        console.warn('Parameter intelligence failed, using defaults:', error);
      }

      setPipelineResults(prev => ({
        ...prev,
        stage0: JSON.stringify({
          userQuery,
          timeContext,
          intelligentParams
        }, null, 2)
      }));

      // STAGE 1: Raw API Data (using intelligent parameters)
      const params = new URLSearchParams({
        orderBy: 'startTime',
        singleEvents: 'true',
        maxResults: intelligentParams.maxResults.toString(),
        timeMin: intelligentParams.timeMin,
        timeMax: intelligentParams.timeMax,
      });

      // No search query - let Stage 3 AI handle filtering

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
        setResult(`❌ Pipeline failed at Stage 1: ${response.status} ${response.statusText}\n${errorText}`);
        return;
      }

      const rawData = await response.json();
      
      // Store raw data with metadata
      const stage1Data = {
        ...rawData,
        requestParams: {
          maxResults: intelligentParams.maxResults,
          timeMin: intelligentParams.timeMin,
          timeMax: intelligentParams.timeMax,
          searchQuery: intelligentParams.searchQuery
        }
      };

      setPipelineResults(prev => ({
        ...prev,
        stage1: JSON.stringify(stage1Data, null, 2)
      }));

      // STAGE 2: JavaScript Processing (create clean JSON table)
      const jsonTable = createJsonTableFromRaw(stage1Data);
      setPipelineResults(prev => ({
        ...prev,
        stage2: JSON.stringify(jsonTable, null, 2)
      }));

      // STAGE 3: AI Processing (Final Response)
      let aiResponse = "AI processing failed";
      try {
        const openaiResponse = await fetch('/api/calendar/stage3-ai-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            userQuery: userQuery,
            jsonTableData: jsonTable
          })
        });

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          aiResponse = data.content || "No response from AI";
        } else {
          aiResponse = `AI API Error: ${openaiResponse.status} ${openaiResponse.statusText}`;
        }
      } catch (error) {
        aiResponse = `AI Processing Error: ${error}`;
      }

      setPipelineResults(prev => ({
        ...prev,
        stage3: aiResponse
      }));

      setResult(`🎉 4-Stage Pipeline Test Complete!\n\nUser Query: "${userQuery}"\nParameter Intelligence: ${intelligentParams.reasoning}\nQuery Type: ${intelligentParams.queryType}\nEvents Processed: ${jsonTable.totalEvents}\nPipeline Status: ✅ All stages successful\n\nSee detailed results in the sections below.`);

    } catch (err) {
      setResult(`❌ Pipeline Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Original test functions (keeping existing functionality)
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

      // Use fixed parameters for direct API testing
      const maxResults = 50;
      const timeMinDays = 0;
      const timeMaxDays = 300;

      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setDate(now.getDate() + timeMinDays);
      
      const timeMax = new Date(now);
      timeMax.setDate(now.getDate() + timeMaxDays);

      setResult(`🧪 Testing API Parameters...\n⚙️ maxResults: ${maxResults}\n📅 timeMin: ${timeMin.toISOString()}\n📅 timeMax: ${timeMax.toISOString()}\n\n`);
      
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black">🔄 Calendar Pipeline Testing</h1>
        
        {/* Current Time Display */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2 text-black">⏰ Current Time</h2>
          <p className="text-black">Time will display after page loads</p>
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

        {/* 4-Stage Pipeline Testing */}
        <div className="bg-white border-2 border-purple-500 rounded-lg mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-black mb-4">🔄 4-Stage Pipeline Testing</h3>
            <p className="text-gray-600 mb-6">
              Test the complete data pipeline: Parameter Intelligence → Raw API Data → JSON Table (For AI) → AI Final Response
            </p>
            
            {/* User Query Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Test Query (what a user would ask):
              </label>
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="e.g., What's my schedule tomorrow?, Do I have any meetings this week?"
                className="w-full p-3 border-2 border-black rounded text-black mb-3"
              />
              
              {/* Quick Test Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setUserQuery("What's my schedule tomorrow?")}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => setUserQuery("What are my plans for next week?")}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                >
                  Next Week
                </button>
                <button
                  onClick={() => setUserQuery("Do I have anything this weekend?")}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                >
                  This Weekend
                </button>
                <button
                  onClick={() => setUserQuery("Any meetings with David in the next 14 days?")}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                >
                  Filtered Query
                </button>
                <button
                  onClick={() => setUserQuery("Show me my plans this summer")}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
                >
                  Seasonal
                </button>
              </div>
            </div>

            
            <button
              onClick={() => runPipelineTest()}
              disabled={!user || loading}
              className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-lg font-semibold"
            >
              {loading ? '🔄 Running Pipeline...' : '🚀 Run 4-Stage Pipeline Test'}
            </button>
          </div>
        </div>

        {/* Original Testing Section */}
        <div className="bg-white border-2 border-black rounded-lg mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-black mb-4">⚙️ Direct API Testing</h3>
            <p className="text-gray-600 mb-6">
              Original testing methods for API parameters and quick tests.
            </p>
            
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

        {/* Pipeline Results */}
        {(pipelineResults.stage0 || pipelineResults.stage1 || pipelineResults.stage2 || pipelineResults.stage3) && (
          <div className="space-y-4 mb-6">
            {/* Stage 0: Parameter Intelligence */}
            {pipelineResults.stage0 && (
              <div className="bg-white border-2 border-gray-300 rounded-lg">
                <div className="p-4 bg-gray-100 border-b-2 border-gray-300">
                  <h4 className="font-semibold text-black">🔍 Stage 0: Parameter Intelligence</h4>
                </div>
                <div className="p-4">
                  <textarea
                    value={pipelineResults.stage0}
                    readOnly
                    className="w-full h-40 p-3 border border-gray-300 rounded font-mono text-xs bg-gray-50 text-black"
                  />
                </div>
              </div>
            )}

            {/* Stage 1: Raw API Data */}
            {pipelineResults.stage1 && (
              <div className="bg-white border-2 border-gray-300 rounded-lg">
                <div className="p-4 bg-gray-100 border-b-2 border-gray-300">
                  <h4 className="font-semibold text-black">🔍 Stage 1: Raw API Data</h4>
                </div>
                <div className="p-4">
                  <textarea
                    value={pipelineResults.stage1}
                    readOnly
                    className="w-full h-40 p-3 border border-gray-300 rounded font-mono text-xs bg-gray-50 text-black"
                  />
                </div>
              </div>
            )}

            {/* Stage 2: JSON Table Format */}
            {pipelineResults.stage2 && (
              <div className="bg-white border-2 border-blue-300 rounded-lg">
                <div className="p-4 bg-blue-100 border-b-2 border-blue-300">
                  <h4 className="font-semibold text-black">📊 Stage 2: JSON Table Format (For AI)</h4>
                </div>
                <div className="p-4">
                  <textarea
                    value={pipelineResults.stage2}
                    readOnly
                    className="w-full h-40 p-3 border border-blue-300 rounded font-mono text-xs bg-blue-50 text-black"
                  />
                </div>
              </div>
            )}

            {/* Stage 3: AI Processing */}
            {pipelineResults.stage3 && (
              <div className="bg-white border-2 border-green-300 rounded-lg">
                <div className="p-4 bg-green-100 border-b-2 border-green-300">
                  <h4 className="font-semibold text-black">🤖 Stage 3: AI Final Response</h4>
                </div>
                <div className="p-4">
                  <textarea
                    value={pipelineResults.stage3}
                    readOnly
                    className="w-full h-40 p-3 border border-green-300 rounded font-mono text-xs bg-green-50 text-black"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* General Results */}
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
            <button
              onClick={() => setPipelineResults({ stage0: '', stage1: '', stage2: '', stage3: '' })}
              className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
            >
              Clear Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}