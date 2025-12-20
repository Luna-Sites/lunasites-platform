import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { config } from '../config/index.js';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken & { role?: string };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Admin middleware - checks if user has admin role in Firestore
 */
export async function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user.role = 'admin';
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
}
