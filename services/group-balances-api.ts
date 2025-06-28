import axios from 'axios';
import { API_URL } from './api';

// Get user balance within a group
export const getUserBalance = async (groupId: string, userId: string) => {
  return axios.get(`${API_URL}/groups/${groupId}/members/${userId}/balance`);
};

// Get all balances for a group
export const getGroupBalances = async (groupId: string) => {
  if (!groupId || groupId === 'undefined') {
    throw new Error('No valid group ID provided');
  }
  console.log('API call - Getting balances for group:', groupId);

  // For now, if we don't have a real balance endpoint, return mock data
  // TODO: Replace with real API call when available
  return Promise.resolve({
    data: {
      groupId,
      members: [
        // Mock data for demonstration - replace with actual API call
        {
          id: '1',
          fullName: 'Current User',
          avatarUrl: null,
          balance: 150,
          isYou: true,
        },
        { id: '2', fullName: 'Team Member 1', avatarUrl: null, balance: -100 },
        { id: '3', fullName: 'Team Member 2', avatarUrl: null, balance: -50 },
      ],
    },
  });
};

// Get expense splits for a user
export const getUserExpenseSplits = async (groupId: string, userId: string) => {
  return axios.get(`${API_URL}/expenses/splits`, {
    params: { groupId, userId },
  });
};

// Get expenses paid by a user
export const getUserPaidExpenses = async (groupId: string, userId: string) => {
  return axios.get(`${API_URL}/expenses`, {
    params: { groupId, paidBy: userId },
  });
};

// Calculate simplified debts
export interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
}

export const calculateSimplifiedDebts = (
  members: Array<{
    id: string;
    full_name: string | null;
    balance: number;
  }>
) => {
  // Calculate net balances
  const balances = new Map<string, number>();
  members.forEach((member) => {
    balances.set(member.id, member.balance);
  });

  // Simplify debts algorithm
  const creditors: Array<{ id: string; amount: number; name: string }> = [];
  const debtors: Array<{ id: string; amount: number; name: string }> = [];

  members.forEach((member) => {
    if (member.balance > 0.01) {
      creditors.push({
        id: member.id,
        amount: member.balance,
        name: member.full_name || 'Unknown',
      });
    } else if (member.balance < -0.01) {
      debtors.push({
        id: member.id,
        amount: Math.abs(member.balance),
        name: member.full_name || 'Unknown',
      });
    }
  });

  const simplified: SimplifiedDebt[] = [];

  // Sort by amount (largest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let i = 0,
    j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0.01) {
      simplified.push({
        from: debtor.id,
        to: creditor.id,
        amount,
        fromName: debtor.name,
        toName: creditor.name,
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return simplified;
};
