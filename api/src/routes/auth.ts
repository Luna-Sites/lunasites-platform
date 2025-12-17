import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import { config } from '../config/index.js';

const router = Router();

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
}

const COOKIE_NAME = '__session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

// Create session cookie from Firebase ID token
router.post('/session', async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'ID token is required' });
  }

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Create a session cookie
    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn: COOKIE_MAX_AGE,
    });

    // Set the cookie
    res.cookie(COOKIE_NAME, sessionCookie, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      }
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(401).json({ error: 'Invalid ID token' });
  }
});

// Verify session cookie and return user info
router.get('/session', async (req: Request, res: Response) => {
  const sessionCookie = req.cookies?.[COOKIE_NAME];

  if (!sessionCookie) {
    return res.status(401).json({ error: 'No session', authenticated: false });
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);

    return res.json({
      authenticated: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
      }
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(401).json({ error: 'Invalid session', authenticated: false });
  }
});

// Delete session cookie (logout)
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.json({ success: true });
});

export default router;
