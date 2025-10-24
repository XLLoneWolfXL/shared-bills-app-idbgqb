
import { supabase } from '@/app/integrations/supabase/client';
import { Bill, User, SharedConnection, BillActivity, NotificationPreference, ConnectionCode } from '@/types/bill';
import { generateId } from './billUtils';

// User operations
export const createUserProfile = async (userId: string, name: string, email: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          user_id: userId,
          name,
          email,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.log('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        avatar_url: updates.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('Error updating user profile:', error);
    throw error;
  }
};

// Connection code operations
export const generateConnectionCode = async (userId: string): Promise<string> => {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('connection_codes')
      .insert([
        {
          code,
          created_by: userId,
          expires_at: expiresAt,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return code;
  } catch (error) {
    console.log('Error generating connection code:', error);
    throw error;
  }
};

export const validateConnectionCode = async (code: string) => {
  try {
    const { data, error } = await supabase
      .from('connection_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt || data.used_by) {
      return null;
    }

    return data;
  } catch (error) {
    console.log('Error validating connection code:', error);
    return null;
  }
};

export const markCodeAsUsed = async (code: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('connection_codes')
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('code', code);

    if (error) throw error;
  } catch (error) {
    console.log('Error marking code as used:', error);
    throw error;
  }
};

// Shared connection operations
export const createSharedConnection = async (userId1: string, userId2: string) => {
  try {
    const { data, error } = await supabase
      .from('shared_connections')
      .insert([
        {
          user_id_1: userId1,
          user_id_2: userId2,
          status: 'pending',
          user_1_accepted: userId1 === (await supabase.auth.getUser()).data.user?.id,
          user_2_accepted: false,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('Error creating shared connection:', error);
    throw error;
  }
};

export const getSharedConnection = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('shared_connections')
      .select('*')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'accepted')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.log('Error getting shared connection:', error);
    return null;
  }
};

export const acceptConnection = async (connectionId: string, userId: string) => {
  try {
    const { data: connection, error: fetchError } = await supabase
      .from('shared_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (fetchError) throw fetchError;

    const isUser1 = connection.user_id_1 === userId;
    const updateData = isUser1
      ? { user_1_accepted: true }
      : { user_2_accepted: true };

    const { error } = await supabase
      .from('shared_connections')
      .update({
        ...updateData,
        status: connection.user_1_accepted && connection.user_2_accepted ? 'accepted' : 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) throw error;
  } catch (error) {
    console.log('Error accepting connection:', error);
    throw error;
  }
};

export const disconnectUsers = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('shared_connections')
      .delete()
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) throw error;
  } catch (error) {
    console.log('Error disconnecting users:', error);
    throw error;
  }
};

// Bill operations
export const createBill = async (bill: Bill, userId: string, connectionId?: string) => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .insert([
        {
          created_by: userId,
          shared_connection_id: connectionId || null,
          name: bill.name,
          amount: bill.amount,
          due_date: bill.dueDate,
          frequency: bill.frequency,
          notes: bill.notes || null,
          paid_by_user_1: false,
          paid_by_user_2: false,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('Error creating bill:', error);
    throw error;
  }
};

export const getBills = async (userId: string, connectionId?: string) => {
  try {
    let query = supabase
      .from('bills')
      .select('*');

    if (connectionId) {
      query = query.or(`created_by.eq.${userId},shared_connection_id.eq.${connectionId}`);
    } else {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.log('Error getting bills:', error);
    return [];
  }
};

export const updateBill = async (billId: string, updates: Partial<Bill>) => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.amount) updateData.amount = updates.amount;
    if (updates.dueDate) updateData.due_date = updates.dueDate;
    if (updates.frequency) updateData.frequency = updates.frequency;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.paidByUser1 !== undefined) updateData.paid_by_user_1 = updates.paidByUser1;
    if (updates.paidByUser2 !== undefined) updateData.paid_by_user_2 = updates.paidByUser2;

    const { data, error } = await supabase
      .from('bills')
      .update(updateData)
      .eq('id', billId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('Error updating bill:', error);
    throw error;
  }
};

export const deleteBill = async (billId: string) => {
  try {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId);

    if (error) throw error;
  } catch (error) {
    console.log('Error deleting bill:', error);
    throw error;
  }
};

// Bill activity operations
export const addBillActivity = async (activity: BillActivity) => {
  try {
    const { error } = await supabase
      .from('bill_activities')
      .insert([
        {
          bill_id: activity.billId,
          user_id: activity.userId,
          action: activity.type,
          details: {
            description: activity.description,
            userName: activity.userName,
            metadata: activity.metadata,
          },
        }
      ]);

    if (error) throw error;
  } catch (error) {
    console.log('Error adding bill activity:', error);
    throw error;
  }
};

export const getBillActivities = async (billId?: string) => {
  try {
    let query = supabase
      .from('bill_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (billId) {
      query = query.eq('bill_id', billId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.log('Error getting bill activities:', error);
    return [];
  }
};

// Notification preferences operations
export const getNotificationPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.log('Error getting notification preferences:', error);
    return null;
  }
};

export const saveNotificationPreferences = async (userId: string, prefs: Partial<NotificationPreference>) => {
  try {
    const existing = await getNotificationPreferences(userId);

    if (existing) {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          reminder_days_before: prefs.daysBeforeDue?.[0] || 1,
          notify_on_paid: prefs.notifyOnPaid ?? true,
          notify_on_overdue: prefs.notifyOnOverdue ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('notification_preferences')
        .insert([
          {
            user_id: userId,
            reminder_days_before: prefs.daysBeforeDue?.[0] || 1,
            notify_on_paid: prefs.notifyOnPaid ?? true,
            notify_on_overdue: prefs.notifyOnOverdue ?? true,
          }
        ]);

      if (error) throw error;
    }
  } catch (error) {
    console.log('Error saving notification preferences:', error);
    throw error;
  }
};

// Bill splits operations
export const createBillSplit = async (billId: string, connectionId: string, user1Percentage: number, user2Percentage: number) => {
  try {
    const { data, error } = await supabase
      .from('bill_splits')
      .insert([
        {
          bill_id: billId,
          shared_connection_id: connectionId,
          user_1_percentage: user1Percentage,
          user_2_percentage: user2Percentage,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('Error creating bill split:', error);
    throw error;
  }
};

export const getBillSplit = async (billId: string) => {
  try {
    const { data, error } = await supabase
      .from('bill_splits')
      .select('*')
      .eq('bill_id', billId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.log('Error getting bill split:', error);
    return null;
  }
};

export const updateBillSplit = async (billId: string, user1Percentage: number, user2Percentage: number) => {
  try {
    const { error } = await supabase
      .from('bill_splits')
      .update({
        user_1_percentage: user1Percentage,
        user_2_percentage: user2Percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('bill_id', billId);

    if (error) throw error;
  } catch (error) {
    console.log('Error updating bill split:', error);
    throw error;
  }
};
