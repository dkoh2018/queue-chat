import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('🔍 OAUTH TOKEN DIAGNOSTIC STARTING...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const diagnostics: {
      userId: string;
      timestamp: string;
      tests: Record<string, any>;
    } = {
      userId,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // TEST 1: Get user from Supabase Admin
    console.log('\n📋 TEST 1: Supabase Admin User Lookup');
    try {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      diagnostics.tests.supabaseAdminUser = {
        success: !userError && !!user,
        error: userError?.message,
        hasUser: !!user,
        userEmail: user?.email,
        createdAt: user?.created_at,
        lastSignInAt: user?.last_sign_in_at,
        identityCount: user?.identities?.length || 0
      };
      
      console.log(`   ✅ User found: ${user?.email}`);
      console.log(`   📊 Identities: ${user?.identities?.length || 0}`);
      console.log(`   🕐 Last sign in: ${user?.last_sign_in_at}`);
      
      // TEST 2: Check user identities
      console.log('\n🔐 TEST 2: User Identity Analysis');
      if (user?.identities && user.identities.length > 0) {
        user.identities.forEach((identity, index) => {
          console.log(`   Identity ${index + 1}:`);
          console.log(`     Provider: ${identity.provider}`);
          console.log(`     Created: ${identity.created_at}`);
          console.log(`     Updated: ${identity.updated_at}`);
          
          if (identity.provider === 'google') {
            const identityData = identity.identity_data || {};
            console.log(`     📧 Email: ${identityData.email}`);
            console.log(`     👤 Name: ${identityData.full_name}`);
            console.log(`     🔑 Has provider_token: ${!!identityData.provider_token}`);
            console.log(`     🔄 Has refresh_token: ${!!identityData.provider_refresh_token}`);
            
            if (identityData.provider_token) {
              console.log(`     📏 Token length: ${identityData.provider_token.length}`);
              console.log(`     🔤 Token preview: ${identityData.provider_token.substring(0, 20)}...`);
            }
            
            diagnostics.tests.googleIdentity = {
              found: true,
              hasProviderToken: !!identityData.provider_token,
              hasRefreshToken: !!identityData.provider_refresh_token,
              tokenLength: identityData.provider_token?.length || 0,
              email: identityData.email,
              fullName: identityData.full_name,
              identityCreated: identity.created_at,
              identityUpdated: identity.updated_at
            };
          }
        });
      } else {
        console.log('   ❌ No identities found');
        diagnostics.tests.googleIdentity = { found: false };
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      diagnostics.tests.supabaseAdminUser = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // TEST 3: Check user_oauth_tokens table
    console.log('\n🗄️ TEST 3: Database OAuth Tokens Table');
    try {
      const { data: tokens, error: tokensError } = await supabaseAdmin
        .from('user_oauth_tokens')
        .select('*')
        .eq('user_id', userId);
      
      diagnostics.tests.databaseTokens = {
        success: !tokensError,
        error: tokensError?.message,
        tokenCount: tokens?.length || 0,
        tokens: tokens || []
      };
      
      if (tokens && tokens.length > 0) {
        console.log(`   ✅ Found ${tokens.length} token(s) in database`);
        tokens.forEach((token, index) => {
          console.log(`   Token ${index + 1}:`);
          console.log(`     Provider: ${token.provider}`);
          console.log(`     Created: ${token.created_at}`);
          console.log(`     Updated: ${token.updated_at}`);
          console.log(`     Has token: ${!!token.provider_token}`);
          console.log(`     Has refresh: ${!!token.provider_refresh_token}`);
          console.log(`     Token length: ${token.provider_token?.length || 0}`);
          console.log(`     Scopes: ${token.scopes}`);
        });
      } else {
        console.log('   ❌ No tokens found in database');
      }
      
    } catch (error) {
      console.log(`   ❌ Database error: ${error}`);
      diagnostics.tests.databaseTokens = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // TEST 4: Test Google Calendar API if we found any token
    console.log('\n🌐 TEST 4: Google Calendar API Test');
    let testToken = null;
    
    // Try to get token from identity_data first
    if (diagnostics.tests.googleIdentity?.hasProviderToken) {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
      const googleIdentity = user?.identities?.find(id => id.provider === 'google');
      testToken = googleIdentity?.identity_data?.provider_token;
      console.log('   🎯 Using token from identity_data');
    }
    
    // Fallback to database token
    if (!testToken && diagnostics.tests.databaseTokens?.tokens?.length > 0) {
      testToken = diagnostics.tests.databaseTokens.tokens[0].provider_token;
      console.log('   🎯 Using token from database');
    }
    
    if (testToken) {
      try {
        console.log(`   🔍 Testing with token: ${testToken.substring(0, 20)}...`);
        
        const calendarResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1',
          {
            headers: {
              'Authorization': `Bearer ${testToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        const responseText = await calendarResponse.text();
        
        diagnostics.tests.googleCalendarAPI = {
          success: calendarResponse.ok,
          status: calendarResponse.status,
          statusText: calendarResponse.statusText,
          responsePreview: responseText.substring(0, 200),
          tokenWorking: calendarResponse.ok
        };
        
        if (calendarResponse.ok) {
          console.log('   ✅ Google Calendar API SUCCESS!');
          console.log(`   📊 Response: ${calendarResponse.status} ${calendarResponse.statusText}`);
          const data = JSON.parse(responseText);
          console.log(`   📅 Calendar accessible: ${data.summary || 'Primary calendar'}`);
        } else {
          console.log('   ❌ Google Calendar API FAILED');
          console.log(`   📊 Response: ${calendarResponse.status} ${calendarResponse.statusText}`);
          console.log(`   💬 Error: ${responseText.substring(0, 100)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ API call failed: ${error}`);
        diagnostics.tests.googleCalendarAPI = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      console.log('   ⚠️ No token available for testing');
      diagnostics.tests.googleCalendarAPI = {
        success: false,
        error: 'No token available'
      };
    }

    // SUMMARY
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 User: ${diagnostics.tests.supabaseAdminUser?.userEmail || 'Unknown'}`);
    console.log(`🔐 Google Identity: ${diagnostics.tests.googleIdentity?.found ? '✅' : '❌'}`);
    console.log(`💾 Database Tokens: ${diagnostics.tests.databaseTokens?.tokenCount || 0}`);
    console.log(`🌐 Calendar API: ${diagnostics.tests.googleCalendarAPI?.success ? '✅' : '❌'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json(diagnostics);
    
  } catch (error) {
    console.error('🚨 DIAGNOSTIC ERROR:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 