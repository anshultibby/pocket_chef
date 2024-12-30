import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
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
    const items = await request.json();

    const response = await fetch('https://api.kroger.com/v1/cart/add', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to add items to cart' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cart operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
