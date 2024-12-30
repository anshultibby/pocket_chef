import { cookies } from 'next/headers';
import { decrypt, encrypt } from '@/lib/encryption';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID!;
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    const cookieStore = await cookies();
    const storedState = cookieStore.get('kroger_state');
    
    if (!storedState || decrypt(storedState.value) !== state) {
      throw new Error('Invalid state parameter');
    }

    const tokenResponse = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code!,
        redirect_uri: process.env.NEXT_PUBLIC_URL + '/api/kroger/auth/callback'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    cookieStore.set('kroger_tokens', encrypt(JSON.stringify(tokens)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in
    });

    cookieStore.delete('kroger_state');

    return NextResponse.redirect(new URL('/home?tab=shopping&connected=true', request.url));

  } catch (error) {
    return NextResponse.redirect(new URL('/home?tab=shopping&error=auth_failed', request.url));
  }
}
