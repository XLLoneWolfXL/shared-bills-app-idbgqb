
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useBillContext } from '@/contexts/BillContext';
import BillCard from '@/components/BillCard';
import { colors } from '@/styles/commonStyles';
import { Bill } from '@/types/bill';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentUser, bills, updateBill, sharedConnection, isLoading } = useBillContext();
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);

  useEffect(() => {
    setFilteredBills(bills);
  }, [bills]);

  const handleTogglePaid = async (billId: string, paidByUser1: boolean, paidByUser2: boolean) => {
    try {
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;

      const updatedBill = {
        ...bill,
        paidByUser1,
        paidByUser2,
      };

      await updateBill(updatedBill);
    } catch (error) {
      console.log('Error updating bill:', error);
      Alert.alert('Error', 'Failed to update bill');
    }
  };

  const handleAddBill = () => {
    router.push('/(tabs)/(home)/add-bill');
  };

  const handleBillPress = (billId: string) => {
    router.push({
      pathname: '/(tabs)/(home)/bill-details',
      params: { billId },
    });
  };

  const renderBill = ({ item }: { item: Bill }) => (
    <BillCard
      bill={item}
      onPress={() => handleBillPress(item.id)}
      onTogglePaid={(paidByUser1, paidByUser2) =>
        handleTogglePaid(item.id, paidByUser1, paidByUser2)
      }
      currentUserId={currentUser?.id || ''}
      isShared={!!sharedConnection && sharedConnection.user1Accepted && sharedConnection.user2Accepted}
    />
  );

  const renderHeaderRight = () => (
    <Pressable onPress={handleAddBill} style={styles.headerButton}>
      <IconSymbol name="plus" color={colors.primary} size={24} />
    </Pressable>
  );

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.push('/(tabs)/profile')}
      style={styles.headerButton}
    >
      <IconSymbol name="gear" color={colors.primary} size={24} />
    </Pressable>
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark : colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Bills',
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark : colors.background },
        ]}
        edges={['top']}
      >
        {!currentUser ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.crop.circle.badge.exclamationmark" size={48} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: isDark ? colors.card : colors.text }]}>
              Welcome to Bills
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Set up your profile to get started
            </Text>
            <Pressable
              style={[styles.setupButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.setupButtonText}>Set Up Profile</Text>
            </Pressable>
          </View>
        ) : filteredBills.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text" size={48} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: isDark ? colors.card : colors.text }]}>
              No Bills Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add your first bill to get started
            </Text>
            <Pressable
              style={[styles.setupButton, { backgroundColor: colors.primary }]}
              onPress={handleAddBill}
            >
              <Text style={styles.setupButtonText}>Add Bill</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredBills}
            renderItem={renderBill}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContainer,
              Platform.OS !== 'ios' && styles.listContainerWithTabBar,
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  listContainerWithTabBar: {
    paddingBottom: 100,
  },
  headerButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  setupButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});
