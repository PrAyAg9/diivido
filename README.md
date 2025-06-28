# Divido - Expense Splitting App

## Overview

Divido is a payment splitting app built with:

- **Frontend**: React Native with Expo
- **Backend**: Node.js/Express with MongoDB

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account (or local MongoDB)

### Setup and Installation

#### Step 1: Clone the repository

```bash
git clone <repository-url>
cd divido
```

#### Step 2: Install Frontend Dependencies

In the root directory:

```bash
npm install
```

#### Step 3: Setup Backend

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Configure your MongoDB connection in the `.env` file:

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
```

Build the TypeScript code:

```bash
npm run build
```

#### Step 4: Running the App

1. **Start the Backend Server** (in one terminal):

   ```bash
   cd backend
   npm run dev
   ```

   The server will start on http://localhost:5000

2. **Start the Frontend** (in another terminal):

   ```bash
   # From the root directory
   npx expo start
   ```

   This will start the Expo development server.

3. **Connect to the App**:
   - Use the Expo Go app on your phone to scan the QR code
   - Press 'w' to open in a web browser
   - Press 'a' to open in an Android emulator
   - Press 'i' to open in an iOS simulator

### Important Configuration Notes

1. **When testing on a real device**:
   Update the API URL in `services/api.ts` to point to your computer's IP address rather than localhost:

   ```typescript
   // Change this:
   export const API_URL = 'http://localhost:5000/api';

   // To this (replace with your computer's IP):
   export const API_URL = 'http://192.168.1.100:5000/api';
   ```

2. **MongoDB Connection**:
   Make sure your MongoDB connection string in the backend `.env` file has the correct password.

## Features

- User authentication
- Create and manage groups
- Add and track expenses
- Split expenses equally or custom amounts
- Record payments
- View balances and activity

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

## Troubleshooting

1. **Connection Issues**: If your app can't connect to the backend:

   - Check that both servers are running
   - Verify the API URL is correct (especially if testing on a physical device)
   - Check for any network restrictions or firewall issues

2. **Database Errors**:

   - Verify your MongoDB connection string
   - Ensure your IP address is whitelisted in MongoDB Atlas
   - Check the server logs for specific errors

3. **Authentication Problems**:

   - Clear AsyncStorage if you're experiencing login loops
   - Check the JWT_SECRET matches between environments

4. **Missing Packages**:
   - Run `npm install` in both the root directory and the backend directory
