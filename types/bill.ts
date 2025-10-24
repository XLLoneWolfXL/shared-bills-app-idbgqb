
export type BillFrequency = 'one-time' | 'weekly' | 'monthly';
export type BillStatus = 'due' | 'upcoming' | 'paid';

export interface BillSplit {
  user1Percentage: number; // 0-100
  user2Percentage: number; // 0-100
}

export interface BillComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface BillActivity {
  id: string;
  billId: string;
  type: 'created' | 'paid' | 'unpaid' | 'edited' | 'commented' | 'deleted';
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  userId: string;
  daysBeforeDue: number[]; // e.g., [1, 3, 7]
  notifyOnPaid: boolean;
  notifyOnOverdue: boolean;
  enabled: boolean;
}

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
  split?: BillSplit; // Default 50/50
  comments?: BillComment[];
  sharedNotes?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  notificationPreferences?: NotificationPreference;
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
