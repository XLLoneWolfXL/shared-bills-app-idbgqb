
export type BillFrequency = 'one-time' | 'weekly' | 'monthly';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO date string
  notes?: string;
  frequency: BillFrequency;
  createdAt: string;
  createdBy: string; // userId
  paidByUser1: boolean;
  paidByUser2: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface ConnectionCode {
  code: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
}

export interface SharedConnection {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Accepted: boolean;
  user2Accepted: boolean;
  connectedAt: string;
}

export type BillStatus = 'due' | 'upcoming' | 'paid';
