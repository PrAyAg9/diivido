import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        fullName?: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Set user info in request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    };

    console.log('Authenticated user:', req.user);
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Token is not valid' });
  }
};
