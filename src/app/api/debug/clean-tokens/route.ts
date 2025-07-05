import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('🧹 CLEANING UP MOCK TOKENS...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Step 1: Remove mock tokens from database
    console.log('\n🗑️ STEP 1: Removing mock tokens from database');
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('user_oauth_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('provider_token', 'mock_access_token_for_testing');
      
      if (deleteError) {
        console.log(`   ❌ Error deleting mock tokens: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Removed mock tokens from database`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    // Step 2: Check what tokens remain
    console.log('\n📊 STEP 2: Checking remaining tokens');
    const { data: remainingTokens, error: checkError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('*')
      .eq('user_id', userId);
    
    if (checkError) {
      console.log(`   ❌ Error checking tokens: ${checkError.message}`);
    } else {
      console.log(`   📊 Remaining tokens: ${remainingTokens?.length || 0}`);
      if (remainingTokens && remainingTokens.length > 0) {
        remainingTokens.forEach((token, index) => {
          console.log(`   Token ${index + 1}: ${token.provider} - ${token.provider_token.substring(0, 20)}...`);
        });
      }
    }

    // Step 3: Check user's current session tokens
    console.log('\n🔍 STEP 3: Checking user identity tokens');
    try {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !user) {
        console.log(`   ❌ Error getting user: ${userError?.message}`);
      } else {
        const googleIdentity = user.identities?.find(id => id.provider === 'google');
        if (googleIdentity) {
          const identityData = googleIdentity.identity_data || {};
          console.log(`   🔑 Has identity provider_token: ${!!identityData.provider_token}`);
          console.log(`   🔄 Has identity refresh_token: ${!!identityData.provider_refresh_token}`);
          
          if (identityData.provider_token) {
            console.log(`   📏 Token length: ${identityData.provider_token.length}`);
            console.log(`   🔤 Token preview: ${identityData.provider_token.substring(0, 20)}...`);
          }
        } else {
          console.log(`   ❌ No Google identity found`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    console.log('\n✅ CLEANUP COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      message: 'Mock tokens cleaned up',
      remainingTokens: remainingTokens?.length || 0
    });

  } catch (error) {
    console.error('🚨 CLEANUP ERROR:', error);
    return NextResponse.json({
      error: 'Cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 