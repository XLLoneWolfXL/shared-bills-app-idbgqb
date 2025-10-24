
import { Bill, BillStatus } from '@/types/bill';

export const getBillStatus = (bill: Bill): BillStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(bill.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  // If both users have paid, it's paid
  if (bill.paidByUser1 && bill.paidByUser2) {
    return 'paid';
  }
  
  // If due date is today or in the past, it's due
  if (dueDate <= today) {
    return 'due';
  }
  
  // Otherwise it's upcoming
  return 'upcoming';
};

export const getStatusColor = (status: BillStatus): string => {
  switch (status) {
    case 'due':
      return '#DC3545'; // Red
    case 'upcoming':
      return '#FFC107'; // Yellow
    case 'paid':
      return '#28A745'; // Green
    default:
      return '#6C757D'; // Gray
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

export const getFrequencyLabel = (frequency: string): string => {
  switch (frequency) {
    case 'one-time':
      return 'One-time';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    default:
      return frequency;
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const calculateUserAmount = (bill: Bill, userPercentage: number): number => {
  return (bill.amount * userPercentage) / 100;
};

export const shouldNotifyForBill = (bill: Bill, daysBeforeDue: number[]): boolean => {
  const daysUntil = getDaysUntilDue(bill.dueDate);
  return daysBeforeDue.includes(daysUntil);
};

export const isOverdue = (bill: Bill): boolean => {
  return getDaysUntilDue(bill.dueDate) < 0 && !bill.paidByUser1 && !bill.paidByUser2;
};
