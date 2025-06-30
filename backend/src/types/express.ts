import { Request } from 'express';

// Extend Express Request type to include user property and ensure body is typed
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    fullName?: string;
  };
  body: any;
}
