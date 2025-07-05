import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check what tokens exist for this user
    const { data: tokens, error } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('*')
      .eq('user_id', userId)

    return NextResponse.json({
      userId,
      tokens,
      tokenCount: tokens?.length || 0,
      error: error?.message
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}