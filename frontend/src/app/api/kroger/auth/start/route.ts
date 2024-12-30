import { cookies } from 'next/headers';
import { encrypt } from '@/lib/encryption';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL + '/api/kroger/auth/callback';

export async function POST() {
  try {
    if (!KROGER_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Missing Kroger client ID configuration' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_URL) {
      return NextResponse.json(
        { error: 'Missing URL configuration' },
        { status: 500 }
      );
    }

    if (!process.env.ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: 'Missing encryption configuration' },
        { status: 500 }
      );
    }
    
    const state = crypto.randomUUID();
    
    const cookieStore = await cookies();
    cookieStore.set('kroger_state', encrypt(state), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5
    });

    const authParams = new URLSearchParams({
      scope: 'cart.basic:write',
      response_type: 'code',
      client_id: KROGER_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state: state
    });

    const authUrl = `https://api.kroger.com/v1/connect/oauth2/authorize?${authParams}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start Kroger authorization' },
      { status: 500 }
    );
  }
}
