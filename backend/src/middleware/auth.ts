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

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error();
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};
