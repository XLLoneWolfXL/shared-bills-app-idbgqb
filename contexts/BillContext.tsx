
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bill, User, SharedConnection, BillActivity, NotificationPreference } from '@/types/bill';
import * as storage from '@/utils/storage';
import { generateId } from '@/utils/billUtils';

interface BillContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => Promise<void>;
  bills: Bill[];
  addBill: (bill: Bill) => Promise<void>;
  updateBill: (bill: Bill) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  sharedConnection: SharedConnection | null;
  generateCode: () => Promise<string>;
  connectWithCode: (code: string, userName: string) => Promise<boolean>;
  acceptConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  activities: BillActivity[];
  getActivities: (billId?: string) => Promise<BillActivity[]>;
  notificationPreferences: NotificationPreference | null;
  updateNotificationPreferences: (prefs: NotificationPreference) => Promise<void>;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export const BillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [sharedConnection, setSharedConnection] = useState<SharedConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<BillActivity[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference | null>(null);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await storage.getCurrentUser();
        if (user) {
          setCurrentUserState(user);
          const connection = await storage.getSharedConnection(user.id);
          setSharedConnection(connection);
          const billsList = await storage.getBills();
          setBills(billsList);
          const allActivities = await storage.getAllActivities();
          setActivities(allActivities);
          const prefs = await storage.getNotificationPreferences(user.id);
          setNotificationPreferences(prefs);
        }
      } catch (error) {
        console.log('Error initializing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const setCurrentUser = async (user: User) => {
    try {
      await storage.setCurrentUser(user);
      await storage.saveUser(user);
      setCurrentUserState(user);
    } catch (error) {
      console.log('Error setting current user:', error);
      throw error;
    }
  };

  const addBill = async (bill: Bill) => {
    try {
      await storage.saveBill(bill);
      setBills([...bills, bill]);
      
      // Log activity
      const activity: BillActivity = {
        id: generateId(),
        billId: bill.id,
        type: 'created',
        userId: currentUser?.id || '',
        userName: currentUser?.name || 'Unknown',
        description: `Created bill "${bill.name}" for $${bill.amount.toFixed(2)}`,
        timestamp: new Date().toISOString(),
      };
      await storage.addBillActivity(activity);
      setActivities([activity, ...activities]);
    } catch (error) {
      console.log('Error adding bill:', error);
      throw error;
    }
  };

  const updateBill = async (bill: Bill) => {
    try {
      const oldBill = bills.find(b => b.id === bill.id);
      await storage.saveBill(bill);
      setBills(bills.map(b => b.id === bill.id ? bill : b));
      
      // Log activity for payment status changes
      if (oldBill) {
        if (oldBill.paidByUser1 !== bill.paidByUser1 || oldBill.paidByUser2 !== bill.paidByUser2) {
          const activity: BillActivity = {
            id: generateId(),
            billId: bill.id,
            type: bill.paidByUser1 && bill.paidByUser2 ? 'paid' : 'unpaid',
            userId: currentUser?.id || '',
            userName: currentUser?.name || 'Unknown',
            description: `Marked bill "${bill.name}" as ${bill.paidByUser1 && bill.paidByUser2 ? 'paid' : 'unpaid'}`,
            timestamp: new Date().toISOString(),
          };
          await storage.addBillActivity(activity);
          setActivities([activity, ...activities]);
        }
      }
    } catch (error) {
      console.log('Error updating bill:', error);
      throw error;
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      const bill = bills.find(b => b.id === billId);
      await storage.deleteBill(billId);
      setBills(bills.filter(b => b.id !== billId));
      
      // Log activity
      if (bill) {
        const activity: BillActivity = {
          id: generateId(),
          billId: billId,
          type: 'deleted',
          userId: currentUser?.id || '',
          userName: currentUser?.name || 'Unknown',
          description: `Deleted bill "${bill.name}"`,
          timestamp: new Date().toISOString(),
        };
        await storage.addBillActivity(activity);
        setActivities([activity, ...activities]);
      }
    } catch (error) {
      console.log('Error deleting bill:', error);
      throw error;
    }
  };

  const generateCode = async (): Promise<string> => {
    try {
      if (!currentUser) throw new Error('No current user');
      const code = await storage.generateConnectionCode(currentUser.id);
      return code;
    } catch (error) {
      console.log('Error generating code:', error);
      throw error;
    }
  };

  const connectWithCode = async (code: string, userName: string): Promise<boolean> => {
    try {
      if (!currentUser) throw new Error('No current user');

      const validCode = await storage.validateConnectionCode(code);
      if (!validCode) return false;

      // Mark code as used
      await storage.markCodeAsUsed(code, currentUser.id);

      // Create shared connection
      const connection = await storage.createSharedConnection(validCode.createdBy, currentUser.id);
      setSharedConnection(connection);

      return true;
    } catch (error) {
      console.log('Error connecting with code:', error);
      return false;
    }
  };

  const acceptConnection = async () => {
    try {
      if (!currentUser || !sharedConnection) throw new Error('Missing data');
      await storage.acceptConnection(sharedConnection.id, currentUser.id);
      const updated = await storage.getSharedConnection(currentUser.id);
      setSharedConnection(updated);
    } catch (error) {
      console.log('Error accepting connection:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      if (!currentUser) throw new Error('No current user');
      await storage.disconnectUsers(currentUser.id);
      setSharedConnection(null);
    } catch (error) {
      console.log('Error disconnecting:', error);
      throw error;
    }
  };

  const getActivities = async (billId?: string): Promise<BillActivity[]> => {
    try {
      const result = await storage.getBillActivities(billId);
      return result;
    } catch (error) {
      console.log('Error getting activities:', error);
      return [];
    }
  };

  const updateNotificationPreferences = async (prefs: NotificationPreference) => {
    try {
      await storage.saveNotificationPreferences(prefs);
      setNotificationPreferences(prefs);
    } catch (error) {
      console.log('Error updating notification preferences:', error);
      throw error;
    }
  };

  return (
    <BillContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        bills,
        addBill,
        updateBill,
        deleteBill,
        sharedConnection,
        generateCode,
        connectWithCode,
        acceptConnection,
        disconnect,
        isLoading,
        activities,
        getActivities,
        notificationPreferences,
        updateNotificationPreferences,
      }}
    >
      {children}
    </BillContext.Provider>
  );
};

export const useBillContext = () => {
  const context = useContext(BillContext);
  if (!context) {
    throw new Error('useBillContext must be used within BillProvider');
  }
  return context;
};
