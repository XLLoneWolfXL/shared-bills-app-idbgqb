
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bill, User, SharedConnection, BillActivity, NotificationPreference } from '@/types/bill';
import { generateId } from '@/utils/billUtils';
import * as supabaseService from '@/utils/supabaseService';
import { supabase } from '@/app/integrations/supabase/client';

interface BillContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => Promise<void>;
  bills: Bill[];
  addBill: (bill: Bill) => Promise<void>;
  updateBill: (bill: Bill) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  sharedConnection: SharedConnection | null;
  generateCode: () => Promise<string>;
  connectWithCode: (code: string) => Promise<boolean>;
  acceptConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  activities: BillActivity[];
  getActivities: (billId?: string) => Promise<BillActivity[]>;
  notificationPreferences: NotificationPreference | null;
  updateNotificationPreferences: (prefs: NotificationPreference) => Promise<void>;
  connectedUser: User | null;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export const BillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [connectedUser, setConnectedUser] = useState<User | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [sharedConnection, setSharedConnection] = useState<SharedConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<BillActivity[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference | null>(null);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.log('Initialize - Auth user:', authUser?.id);
        
        if (authUser) {
          console.log('Auth user found:', authUser.id);
          
          // Get or create user profile
          let userProfile = await supabaseService.getUserProfile(authUser.id);
          console.log('User profile from DB:', userProfile);
          
          if (!userProfile) {
            console.log('No profile found, creating new user profile...');
            try {
              userProfile = await supabaseService.createUserProfile(
                authUser.id,
                authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                authUser.email || ''
              );
              console.log('User profile created:', userProfile);
            } catch (profileError) {
              console.log('Error creating profile during init:', profileError);
              // Continue anyway - user can create profile manually
            }
          }

          if (userProfile) {
            const user: User = {
              id: authUser.id,
              name: userProfile.name || 'User',
              email: authUser.email,
            };

            console.log('Setting current user state:', user);
            setCurrentUserState(user);
          } else {
            console.log('No user profile available, user needs to create one');
          }

          // Get shared connection
          try {
            const connection = await supabaseService.getSharedConnection(authUser.id);
            if (connection) {
              console.log('Shared connection found:', connection.id);
              setSharedConnection(connection);
              
              // Get connected user info
              const connectedUserId = connection.user_id_1 === authUser.id ? connection.user_id_2 : connection.user_id_1;
              const connectedUserProfile = await supabaseService.getUserProfile(connectedUserId);
              if (connectedUserProfile) {
                setConnectedUser({
                  id: connectedUserId,
                  name: connectedUserProfile.name,
                  email: connectedUserProfile.email,
                });
              }
            }
          } catch (connError) {
            console.log('Error getting shared connection:', connError);
          }

          // Get bills
          try {
            const billsList = await supabaseService.getBills(authUser.id, undefined);
            const formattedBills = billsList.map((bill: any) => ({
              id: bill.id,
              name: bill.name,
              amount: bill.amount,
              dueDate: bill.due_date,
              frequency: bill.frequency,
              notes: bill.notes,
              createdAt: bill.created_at,
              createdBy: bill.created_by,
              paidByUser1: bill.paid_by_user_1,
              paidByUser2: bill.paid_by_user_2,
            }));
            setBills(formattedBills);
          } catch (billsError) {
            console.log('Error getting bills:', billsError);
          }

          // Get activities
          try {
            const activitiesList = await supabaseService.getBillActivities();
            const formattedActivities = activitiesList.map((activity: any) => ({
              id: activity.id,
              billId: activity.bill_id,
              type: activity.action,
              userId: activity.user_id,
              userName: activity.details?.userName || 'Unknown',
              description: activity.details?.description || '',
              timestamp: activity.created_at,
              metadata: activity.details?.metadata,
            }));
            setActivities(formattedActivities);
          } catch (activitiesError) {
            console.log('Error getting activities:', activitiesError);
          }

          // Get notification preferences
          try {
            const prefs = await supabaseService.getNotificationPreferences(authUser.id);
            if (prefs) {
              setNotificationPreferences({
                userId: authUser.id,
                daysBeforeDue: [prefs.reminder_days_before],
                notifyOnPaid: prefs.notify_on_paid,
                notifyOnOverdue: prefs.notify_on_overdue,
                enabled: true,
              });
            }
          } catch (prefsError) {
            console.log('Error getting notification preferences:', prefsError);
          }
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
      console.log('setCurrentUser called with:', user);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.log('No authenticated user found');
        throw new Error('No authenticated user found');
      }

      console.log('Auth user found:', authUser.id);

      // Check if user profile exists
      const existingProfile = await supabaseService.getUserProfile(authUser.id);
      console.log('Existing profile:', existingProfile);
      
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile');
        await supabaseService.updateUserProfile(authUser.id, user);
      } else {
        // Create new profile
        console.log('Creating new profile');
        const createdProfile = await supabaseService.createUserProfile(authUser.id, user.name, user.email || '');
        console.log('Profile created:', createdProfile);
      }
      
      console.log('Profile saved successfully, updating state');
      setCurrentUserState(user);
      
      // Verify the profile was saved by fetching it again
      const verifyProfile = await supabaseService.getUserProfile(authUser.id);
      console.log('Verified profile after save:', verifyProfile);
      
      if (!verifyProfile) {
        console.warn('Warning: Profile was not found after save attempt');
      }
    } catch (error) {
      console.log('Error setting current user:', error);
      console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  };

  const addBill = async (bill: Bill) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      const createdBill = await supabaseService.createBill(bill, authUser.id, sharedConnection?.id);
      
      const formattedBill: Bill = {
        id: createdBill.id,
        name: createdBill.name,
        amount: createdBill.amount,
        dueDate: createdBill.due_date,
        frequency: createdBill.frequency,
        notes: createdBill.notes,
        createdAt: createdBill.created_at,
        createdBy: createdBill.created_by,
        paidByUser1: createdBill.paid_by_user_1,
        paidByUser2: createdBill.paid_by_user_2,
      };

      setBills([...bills, formattedBill]);

      // Log activity
      const activity: BillActivity = {
        id: generateId(),
        billId: createdBill.id,
        type: 'created',
        userId: authUser.id,
        userName: currentUser?.name || 'Unknown',
        description: `Created bill "${bill.name}" for $${bill.amount.toFixed(2)}`,
        timestamp: new Date().toISOString(),
      };
      await supabaseService.addBillActivity(activity);
      setActivities([activity, ...activities]);
    } catch (error) {
      console.log('Error adding bill:', error);
      throw error;
    }
  };

  const updateBill = async (bill: Bill) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      const oldBill = bills.find(b => b.id === bill.id);
      await supabaseService.updateBill(bill.id, bill);
      setBills(bills.map(b => b.id === bill.id ? bill : b));

      // Log activity for payment status changes
      if (oldBill) {
        if (oldBill.paidByUser1 !== bill.paidByUser1 || oldBill.paidByUser2 !== bill.paidByUser2) {
          const activity: BillActivity = {
            id: generateId(),
            billId: bill.id,
            type: bill.paidByUser1 && bill.paidByUser2 ? 'paid' : 'unpaid',
            userId: authUser.id,
            userName: currentUser?.name || 'Unknown',
            description: `Marked bill "${bill.name}" as ${bill.paidByUser1 && bill.paidByUser2 ? 'paid' : 'unpaid'}`,
            timestamp: new Date().toISOString(),
          };
          await supabaseService.addBillActivity(activity);
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      const bill = bills.find(b => b.id === billId);
      await supabaseService.deleteBill(billId);
      setBills(bills.filter(b => b.id !== billId));

      // Log activity
      if (bill) {
        const activity: BillActivity = {
          id: generateId(),
          billId: billId,
          type: 'deleted',
          userId: authUser.id,
          userName: currentUser?.name || 'Unknown',
          description: `Deleted bill "${bill.name}"`,
          timestamp: new Date().toISOString(),
        };
        await supabaseService.addBillActivity(activity);
        setActivities([activity, ...activities]);
      }
    } catch (error) {
      console.log('Error deleting bill:', error);
      throw error;
    }
  };

  const generateCode = async (): Promise<string> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      const code = await supabaseService.generateConnectionCode(authUser.id);
      return code;
    } catch (error) {
      console.log('Error generating code:', error);
      throw error;
    }
  };

  const connectWithCode = async (code: string): Promise<boolean> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      const validCode = await supabaseService.validateConnectionCode(code);
      if (!validCode) return false;

      // Mark code as used
      await supabaseService.markCodeAsUsed(code, authUser.id);

      // Create shared connection
      const connection = await supabaseService.createSharedConnection(validCode.created_by, authUser.id);
      setSharedConnection(connection);

      // Get connected user info
      const connectedUserProfile = await supabaseService.getUserProfile(validCode.created_by);
      if (connectedUserProfile) {
        setConnectedUser({
          id: validCode.created_by,
          name: connectedUserProfile.name,
          email: connectedUserProfile.email,
        });
      }

      return true;
    } catch (error) {
      console.log('Error connecting with code:', error);
      return false;
    }
  };

  const acceptConnection = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || !sharedConnection) throw new Error('Missing data');

      await supabaseService.acceptConnection(sharedConnection.id, authUser.id);
      const updated = await supabaseService.getSharedConnection(authUser.id);
      setSharedConnection(updated);
    } catch (error) {
      console.log('Error accepting connection:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      await supabaseService.disconnectUsers(authUser.id);
      setSharedConnection(null);
      setConnectedUser(null);
    } catch (error) {
      console.log('Error disconnecting:', error);
      throw error;
    }
  };

  const getActivities = async (billId?: string): Promise<BillActivity[]> => {
    try {
      const result = await supabaseService.getBillActivities(billId);
      return result.map((activity: any) => ({
        id: activity.id,
        billId: activity.bill_id,
        type: activity.action,
        userId: activity.user_id,
        userName: activity.details?.userName || 'Unknown',
        description: activity.details?.description || '',
        timestamp: activity.created_at,
        metadata: activity.details?.metadata,
      }));
    } catch (error) {
      console.log('Error getting activities:', error);
      return [];
    }
  };

  const updateNotificationPreferences = async (prefs: NotificationPreference) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      await supabaseService.saveNotificationPreferences(authUser.id, prefs);
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
        connectedUser,
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
