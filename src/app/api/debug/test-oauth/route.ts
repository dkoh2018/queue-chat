import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
  }

  console.log('\n🔍 OAUTH TOKEN DIAGNOSTIC');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 Testing for user: ${userId}`);
  
  const results = [];

  // TEST 1: Get user from Supabase Admin
  console.log('\n📋 TEST 1: Supabase Admin User Lookup');
  try {
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.log(`   ❌ Error: ${userError?.message || 'User not found'}`);
      results.push({ test: 'supabase_user', success: false, error: userError?.message });
    } else {
      console.log(`   ✅ User found: ${user.email}`);
      console.log(`   📊 Identities: ${user.identities?.length || 0}`);
      console.log(`   🕐 Last sign in: ${user.last_sign_in_at}`);
      
      results.push({ 
        test: 'supabase_user', 
        success: true, 
        email: user.email,
        identityCount: user.identities?.length || 0,
        lastSignIn: user.last_sign_in_at
      });

      // TEST 2: Check Google Identity
      console.log('\n🔐 TEST 2: Google Identity Check');
      const googleIdentity = user.identities?.find(id => id.provider === 'google');
      
      if (googleIdentity) {
        const identityData = googleIdentity.identity_data || {};
        console.log(`   ✅ Google identity found`);
        console.log(`   📧 Email: ${identityData.email}`);
        console.log(`   👤 Name: ${identityData.full_name}`);
        console.log(`   🔑 Has provider_token: ${!!identityData.provider_token}`);
        console.log(`   🔄 Has refresh_token: ${!!identityData.provider_refresh_token}`);
        
        if (identityData.provider_token) {
          console.log(`   📏 Token length: ${identityData.provider_token.length}`);
          console.log(`   🔤 Token preview: ${identityData.provider_token.substring(0, 20)}...`);
        }
        
        results.push({
          test: 'google_identity',
          success: true,
          hasProviderToken: !!identityData.provider_token,
          hasRefreshToken: !!identityData.provider_refresh_token,
          tokenLength: identityData.provider_token?.length || 0,
          email: identityData.email
        });

        // TEST 3: Test Google Calendar API if token exists
        if (identityData.provider_token) {
          console.log('\n🌐 TEST 3: Google Calendar API Test');
          try {
            const calendarResponse = await fetch(
              'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1',
              {
                headers: {
                  'Authorization': `Bearer ${identityData.provider_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (calendarResponse.ok) {
              const data = await calendarResponse.json();
              console.log('   ✅ Google Calendar API SUCCESS!');
              console.log(`   📊 Response: ${calendarResponse.status}`);
              console.log(`   📅 Calendar: ${data.summary || 'Primary calendar'}`);
              
              results.push({
                test: 'google_calendar_api',
                success: true,
                status: calendarResponse.status,
                calendarAccess: true
              });
            } else {
              const errorText = await calendarResponse.text();
              console.log('   ❌ Google Calendar API FAILED');
              console.log(`   📊 Response: ${calendarResponse.status} ${calendarResponse.statusText}`);
              console.log(`   💬 Error: ${errorText.substring(0, 100)}...`);
              
              results.push({
                test: 'google_calendar_api',
                success: false,
                status: calendarResponse.status,
                error: errorText.substring(0, 100)
              });
            }
          } catch (error) {
            console.log(`   ❌ API call failed: ${error}`);
            results.push({
              test: 'google_calendar_api',
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        } else {
          console.log('\n⚠️ TEST 3: No token available for Google Calendar API test');
          results.push({
            test: 'google_calendar_api',
            success: false,
            error: 'No token available'
          });
        }
      } else {
        console.log('   ❌ No Google identity found');
        results.push({ test: 'google_identity', success: false, error: 'No Google identity' });
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    results.push({ 
      test: 'supabase_user', 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }

  // TEST 4: Check database tokens table
  console.log('\n🗄️ TEST 4: Database OAuth Tokens');
  try {
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('*')
      .eq('user_id', userId);
    
    if (tokensError) {
      console.log(`   ❌ Database error: ${tokensError.message}`);
      results.push({ test: 'database_tokens', success: false, error: tokensError.message });
    } else {
      console.log(`   📊 Found ${tokens?.length || 0} token(s) in database`);
      results.push({ 
        test: 'database_tokens', 
        success: true, 
        tokenCount: tokens?.length || 0,
        tokens: tokens || []
      });
    }
  } catch (error) {
    console.log(`   ❌ Database error: ${error}`);
    results.push({ 
      test: 'database_tokens', 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }

  // SUMMARY
  console.log('\n📋 DIAGNOSTIC SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const summary = {
    userFound: results.find(r => r.test === 'supabase_user')?.success || false,
    googleIdentity: results.find(r => r.test === 'google_identity')?.success || false,
    calendarAPI: results.find(r => r.test === 'google_calendar_api')?.success || false,
    databaseTokens: results.find(r => r.test === 'database_tokens')?.tokenCount || 0
  };
  
  console.log(`👤 User Found: ${summary.userFound ? '✅' : '❌'}`);
  console.log(`🔐 Google Identity: ${summary.googleIdentity ? '✅' : '❌'}`);
  console.log(`🌐 Calendar API: ${summary.calendarAPI ? '✅' : '❌'}`);
  console.log(`💾 Database Tokens: ${summary.databaseTokens}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return NextResponse.json({
    userId,
    timestamp: new Date().toISOString(),
    summary,
    results
  });
} 