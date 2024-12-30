import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/encryption';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get('kroger_tokens');
    
    if (!tokensCookie) {
      return NextResponse.json(
        { error: 'Not authenticated with Kroger' },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(decrypt(tokensCookie.value));
    const response = await fetch('https://api.kroger.com/v1/identity/profile', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Kroger profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
