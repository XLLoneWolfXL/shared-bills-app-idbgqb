
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bill, User, ConnectionCode, SharedConnection } from '@/types/bill';

const STORAGE_KEYS = {
  CURRENT_USER: 'current_user',
  USERS: 'users',
  BILLS: 'bills',
  CONNECTION_CODES: 'connection_codes',
  SHARED_CONNECTIONS: 'shared_connections',
};

// User Management
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.log('Error getting current user:', error);
    return null;
  }
};

export const setCurrentUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (error) {
    console.log('Error setting current user:', error);
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const users = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    if (!users) return null;
    const usersList: User[] = JSON.parse(users);
    return usersList.find(u => u.id === userId) || null;
  } catch (error) {
    console.log('Error getting user:', error);
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    const users = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const usersList: User[] = users ? JSON.parse(users) : [];
    const index = usersList.findIndex(u => u.id === user.id);
    if (index >= 0) {
      usersList[index] = user;
    } else {
      usersList.push(user);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
  } catch (error) {
    console.log('Error saving user:', error);
  }
};

// Bill Management
export const getBills = async (): Promise<Bill[]> => {
  try {
    const bills = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    return bills ? JSON.parse(bills) : [];
  } catch (error) {
    console.log('Error getting bills:', error);
    return [];
  }
};

export const saveBill = async (bill: Bill): Promise<void> => {
  try {
    const bills = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    const billsList: Bill[] = bills ? JSON.parse(bills) : [];
    const index = billsList.findIndex(b => b.id === bill.id);
    if (index >= 0) {
      billsList[index] = bill;
    } else {
      billsList.push(bill);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(billsList));
  } catch (error) {
    console.log('Error saving bill:', error);
  }
};

export const deleteBill = async (billId: string): Promise<void> => {
  try {
    const bills = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    if (!bills) return;
    const billsList: Bill[] = JSON.parse(bills);
    const filtered = billsList.filter(b => b.id !== billId);
    await AsyncStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(filtered));
  } catch (error) {
    console.log('Error deleting bill:', error);
  }
};

// Connection Code Management
export const generateConnectionCode = async (userId: string): Promise<string> => {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const connectionCode: ConnectionCode = {
      code,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      used: false,
    };
    
    const codes = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTION_CODES);
    const codesList: ConnectionCode[] = codes ? JSON.parse(codes) : [];
    codesList.push(connectionCode);
    await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION_CODES, JSON.stringify(codesList));
    
    return code;
  } catch (error) {
    console.log('Error generating connection code:', error);
    throw error;
  }
};

export const validateConnectionCode = async (code: string): Promise<ConnectionCode | null> => {
  try {
    const codes = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTION_CODES);
    if (!codes) return null;
    
    const codesList: ConnectionCode[] = JSON.parse(codes);
    const connectionCode = codesList.find(c => c.code === code);
    
    if (!connectionCode) return null;
    if (connectionCode.used) return null;
    if (new Date(connectionCode.expiresAt) < new Date()) return null;
    
    return connectionCode;
  } catch (error) {
    console.log('Error validating connection code:', error);
    return null;
  }
};

export const markCodeAsUsed = async (code: string, userId: string): Promise<void> => {
  try {
    const codes = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTION_CODES);
    if (!codes) return;
    
    const codesList: ConnectionCode[] = JSON.parse(codes);
    const index = codesList.findIndex(c => c.code === code);
    if (index >= 0) {
      codesList[index].used = true;
      codesList[index].usedBy = userId;
      codesList[index].usedAt = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION_CODES, JSON.stringify(codesList));
    }
  } catch (error) {
    console.log('Error marking code as used:', error);
  }
};

// Shared Connection Management
export const getSharedConnection = async (userId: string): Promise<SharedConnection | null> => {
  try {
    const connections = await AsyncStorage.getItem(STORAGE_KEYS.SHARED_CONNECTIONS);
    if (!connections) return null;
    
    const connectionsList: SharedConnection[] = JSON.parse(connections);
    return connectionsList.find(c => c.user1Id === userId || c.user2Id === userId) || null;
  } catch (error) {
    console.log('Error getting shared connection:', error);
    return null;
  }
};

export const createSharedConnection = async (user1Id: string, user2Id: string): Promise<SharedConnection> => {
  try {
    const connection: SharedConnection = {
      id: Math.random().toString(36).substring(2, 11),
      user1Id,
      user2Id,
      user1Accepted: false,
      user2Accepted: false,
      connectedAt: new Date().toISOString(),
    };
    
    const connections = await AsyncStorage.getItem(STORAGE_KEYS.SHARED_CONNECTIONS);
    const connectionsList: SharedConnection[] = connections ? JSON.parse(connections) : [];
    connectionsList.push(connection);
    await AsyncStorage.setItem(STORAGE_KEYS.SHARED_CONNECTIONS, JSON.stringify(connectionsList));
    
    return connection;
  } catch (error) {
    console.log('Error creating shared connection:', error);
    throw error;
  }
};

export const acceptConnection = async (connectionId: string, userId: string): Promise<void> => {
  try {
    const connections = await AsyncStorage.getItem(STORAGE_KEYS.SHARED_CONNECTIONS);
    if (!connections) return;
    
    const connectionsList: SharedConnection[] = JSON.parse(connections);
    const index = connectionsList.findIndex(c => c.id === connectionId);
    if (index >= 0) {
      if (connectionsList[index].user1Id === userId) {
        connectionsList[index].user1Accepted = true;
      } else if (connectionsList[index].user2Id === userId) {
        connectionsList[index].user2Accepted = true;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.SHARED_CONNECTIONS, JSON.stringify(connectionsList));
    }
  } catch (error) {
    console.log('Error accepting connection:', error);
  }
};

export const disconnectUsers = async (userId: string): Promise<void> => {
  try {
    const connections = await AsyncStorage.getItem(STORAGE_KEYS.SHARED_CONNECTIONS);
    if (!connections) return;
    
    const connectionsList: SharedConnection[] = JSON.parse(connections);
    const filtered = connectionsList.filter(c => c.user1Id !== userId && c.user2Id !== userId);
    await AsyncStorage.setItem(STORAGE_KEYS.SHARED_CONNECTIONS, JSON.stringify(filtered));
  } catch (error) {
    console.log('Error disconnecting users:', error);
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.log('Error clearing all data:', error);
  }
};
