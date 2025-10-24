
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bill, User, SharedConnection } from '@/types/bill';
import * as storage from '@/utils/storage';

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
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export const BillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [sharedConnection, setSharedConnection] = useState<SharedConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (error) {
      console.log('Error adding bill:', error);
      throw error;
    }
  };

  const updateBill = async (bill: Bill) => {
    try {
      await storage.saveBill(bill);
      setBills(bills.map(b => b.id === bill.id ? bill : b));
    } catch (error) {
      console.log('Error updating bill:', error);
      throw error;
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      await storage.deleteBill(billId);
      setBills(bills.filter(b => b.id !== billId));
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
