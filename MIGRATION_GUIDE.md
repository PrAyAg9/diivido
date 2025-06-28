# Divido Backend Migration Guide

## Overview

This guide will help you migrate from Supabase to our new Express + MongoDB backend.

## Frontend Changes Needed

1. Install required packages in your React Native frontend:

   ```bash
   npm install axios @react-native-async-storage/async-storage
   ```

2. Replace the existing `AuthContext.tsx` with the new implementation:

   - Delete all existing code in `contexts/AuthContext.tsx`
   - Replace with the code from `contexts/AuthContext.new.tsx`

3. Update your frontend code that was using Supabase:
   - Remove direct Supabase references in your components
   - Use the new API service for backend calls

## Configuring the Backend

1. Make sure your MongoDB connection is set up correctly in the `.env` file:

   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://pat982003:YourActualPasswordHere@divido.kfbytcw.mongodb.net/?retryWrites=true&w=majority&appName=Divido
   JWT_SECRET=prayag
   ```

   Replace `YourActualPasswordHere` with your actual MongoDB password.

2. Build and start the backend:
   ```bash
   cd backend
   npm run build
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user

### Groups

- `POST /api/groups` - Create a new group
- `GET /api/groups` - Get all groups for the current user
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/members` - Add a member to a group

### Expenses

- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/group/:groupId` - Get expenses for a group
- `PUT /api/expenses/:id` - Update an expense
- `POST /api/expenses/:expenseId/mark-paid` - Mark a split as paid

### Payments

- `POST /api/payments` - Create a new payment
- `GET /api/payments` - Get payments (filtered by groupId if provided)
- `PUT /api/payments/:id/status` - Update payment status

## Important Notes

1. You can safely delete the Supabase integration if all your frontend code has been migrated.
2. When testing on a real device, change the API URL in `services/api.ts` to your computer's IP address.
3. Make sure your MongoDB connection string has the correct password.

## Troubleshooting

If you encounter any issues:

1. Check your MongoDB connection
2. Verify that you've installed all required packages
3. Make sure your API endpoint URLs are correct
4. Check the backend server logs for errors
