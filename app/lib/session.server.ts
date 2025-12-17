// Server-side session utilities for React Router loaders
// This file runs on the server only

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
const COOKIE_NAME = '__session';

export interface SessionUser {
  uid: string;
  email: string;
}

export interface SessionData {
  authenticated: boolean;
  user?: SessionUser;
}

/**
 * Get the session cookie from the request
 */
export function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(cookie => {
      const [name, ...rest] = cookie.split('=');
      return [name, rest.join('=')];
    })
  );

  return cookies[COOKIE_NAME] || null;
}

/**
 * Verify the session with the API server
 */
export async function verifySession(request: Request): Promise<SessionData> {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return { authenticated: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      headers: {
        Cookie: `${COOKIE_NAME}=${sessionCookie}`,
      },
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    const data = await response.json();
    return {
      authenticated: data.authenticated,
      user: data.user,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return { authenticated: false };
  }
}

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth(request: Request): Promise<SessionUser> {
  const session = await verifySession(request);

  if (!session.authenticated || !session.user) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }

  return session.user;
}
