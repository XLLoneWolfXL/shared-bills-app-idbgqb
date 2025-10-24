
export type BillFrequency = 'one-time' | 'weekly' | 'monthly';
export type BillStatus = 'due' | 'upcoming' | 'paid';

export interface BillSplit {
  user1Percentage: number;
  user2Percentage: number;
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
  daysBeforeDue: number[];
  notifyOnPaid: boolean;
  notifyOnOverdue: boolean;
  enabled: boolean;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  notes?: string;
  frequency: BillFrequency;
  createdAt: string;
  createdBy: string;
  paidByUser1: boolean;
  paidByUser2: boolean;
  split?: BillSplit;
  comments?: BillComment[];
  sharedNotes?: string;
  avatar_url?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
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
  user_id_1: string;
  user_id_2: string;
  user_1_accepted: boolean;
  user_2_accepted: boolean;
  status: string;
  created_at: string;
}
