import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file');
  process.exit(1);
}

import authRoutes from './routes/auth.routes';
import groupRoutes from './routes/group.routes';
import expenseRoutes from './routes/expense.routes';
import paymentRoutes from './routes/payment.routes';
import userRoutes from './routes/user.routes';
import invitationRoutes from './routes/invitation.routes';
import friendsRoutes from './routes/friends.routes';
import aiRoutes from './routes/ai.routes';
import quickDrawRoutes from './routes/quickdraw.routes';
import budgetRoutes from './routes/budget.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error: Error) => console.error('MongoDB connection error:', error));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Divido Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Divido Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      groups: '/api/groups',
      expenses: '/api/expenses',
      payments: '/api/payments',
      users: '/api/users',
      invitations: '/api/invitations',
      friends: '/api/friends',
      ai: '/api/ai',
      quickdraw: '/api/quickdraw',
      budget: '/api/budget',
      notifications: '/api/notifications',
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quickdraw', quickDrawRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
