import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users, auditLogs } from '../db/schema.ts';
import { mockStore } from '../server/mockStore.ts';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'hod' | 'faculty' | 'student' | 'placement_officer';
  departmentId?: number | null;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const demoRole = req.headers['x-demo-role'] as string;
    const demoEmail = req.headers['x-demo-email'] as string;

    // 1. If custom demo simulation header is passed (for role testing)
    if (demoRole || demoEmail) {
      const email = demoEmail || (
        demoRole === 'super_admin' ? 'superadmin@aitm.edu' :
        demoRole === 'admin' ? 'admin@aitm.edu' :
        demoRole === 'hod' ? 'hod.cse@aitm.edu' :
        demoRole === 'faculty' ? 'sarah.connor@aitm.edu' :
        demoRole === 'placement_officer' ? 'placement@aitm.edu' :
        'alex.chen@student.aitm.edu'
      );

      try {
        const dbUsers = await db.select().from(users).where(eq(users.email, email));
        if (dbUsers.length > 0) {
          req.user = dbUsers[0] as AuthenticatedUser;
          return next();
        }
      } catch {
        const mockU = mockStore.users.find(u => u.email === email) ||
                      mockStore.users.find(u => u.role === demoRole) ||
                      mockStore.users[0];
        if (mockU) {
          req.user = mockU as AuthenticatedUser;
          return next();
        }
      }
    }

    // 2. Standard Firebase ID Token verification
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const email = decodedToken.email || `${decodedToken.uid}@aitm.edu`;
        const name = decodedToken.name || 'CMS User';

        try {
          let [existingUser] = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
          if (!existingUser) {
            const [byEmail] = await db.select().from(users).where(eq(users.email, email));
            if (byEmail) {
              existingUser = byEmail;
            } else {
              const [newUser] = await db.insert(users).values({
                uid: decodedToken.uid,
                email: email,
                name: name,
                role: 'student',
                avatarUrl: decodedToken.picture || undefined,
              }).returning();
              existingUser = newUser;
            }
          }
          req.user = existingUser as AuthenticatedUser;
          return next();
        } catch {
          let mockU = mockStore.users.find(u => u.email === email || u.uid === decodedToken.uid);
          if (!mockU) {
            mockU = {
              id: mockStore.users.length + 1,
              uid: decodedToken.uid,
              email,
              name,
              role: 'student',
              status: 'active',
            };
            mockStore.users.push(mockU);
          }
          req.user = mockU as AuthenticatedUser;
          return next();
        }
      } catch (tokenErr) {
        console.warn('Firebase token verification error:', tokenErr);
      }
    }

    // Default fallback: super_admin or first mock user
    try {
      const [defaultUser] = await db.select().from(users).where(eq(users.role, 'super_admin'));
      if (defaultUser) {
        req.user = defaultUser as AuthenticatedUser;
        return next();
      }
    } catch {
      req.user = mockStore.users[0] as AuthenticatedUser;
      return next();
    }

    const fallbackUser = mockStore.users[0];
    req.user = fallbackUser as AuthenticatedUser;
    return next();
  } catch (error) {
    console.error('Authentication middleware error, using default persona:', error);
    req.user = mockStore.users[0] as AuthenticatedUser;
    return next();
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Super Admin has universal access
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
};

export async function logAudit(
  req: AuthRequest,
  action: string,
  entity: string,
  entityId?: string | number,
  details?: string
) {
  try {
    const userId = req.user?.id || 1;
    const userEmail = req.user?.email || 'system';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'CMS Client';

    try {
      await db.insert(auditLogs).values({
        userId: userId || null,
        userEmail: userEmail,
        action: action,
        entity: entity,
        entityId: entityId ? String(entityId) : null,
        details: details || null,
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } catch {
      mockStore.auditLogs.unshift({
        id: mockStore.auditLogs.length + 1,
        userId: userId,
        userEmail: userEmail,
        action: action,
        entity: entity,
        entityId: entityId ? String(entityId) : '1',
        details: details || '',
        ipAddress: ipAddress,
        userAgent: userAgent,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
