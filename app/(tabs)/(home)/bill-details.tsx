
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBillContext } from '@/contexts/BillContext';
import { colors } from '@/styles/commonStyles';
import { Bill } from '@/types/bill';
import { formatDate, formatCurrency, getFrequencyLabel, getBillStatus, getStatusColor } from '@/utils/billUtils';
import { IconSymbol } from '@/components/IconSymbol';

export default function BillDetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { billId } = useLocalSearchParams();
  const { bills, updateBill, deleteBill, currentUser, sharedConnection } = useBillContext();
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const foundBill = bills.find(b => b.id === billId);
    setBill(foundBill || null);
  }, [billId, bills]);

  const handleTogglePaid = async () => {
    if (!bill || !currentUser) return;

    try {
      setIsLoading(true);
      const updatedBill = { ...bill };

      if (bill.createdBy === currentUser.id) {
        updatedBill.paidByUser1 = !bill.paidByUser1;
      } else {
        updatedBill.paidByUser2 = !bill.paidByUser2;
      }

      await updateBill(updatedBill);
      setBill(updatedBill);
    } catch (error) {
      console.log('Error updating bill:', error);
      Alert.alert('Error', 'Failed to update bill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBill = () => {
    Alert.alert('Delete Bill', 'Are you sure you want to delete this bill?', [
      { text: 'Cancel', onPress: () => console.log('Cancel') },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            if (bill) {
              await deleteBill(bill.id);
              router.back();
            }
          } catch (error) {
            console.log('Error deleting bill:', error);
            Alert.alert('Error', 'Failed to delete bill');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (!bill) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark : colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Bill not found</Text>
      </View>
    );
  }

  const status = getBillStatus(bill);
  const statusColor = getStatusColor(status);
  const isShared = !!sharedConnection && sharedConnection.user1Accepted && sharedConnection.user2Accepted;
  const isPaidByCurrentUser = bill.createdBy === currentUser?.id ? bill.paidByUser1 : bill.paidByUser2;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Bill Details',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <IconSymbol name="chevron.left" color={colors.primary} size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleDeleteBill} style={styles.headerButton}>
              <IconSymbol name="trash" color={colors.due} size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark : colors.background },
        ]}
        edges={['top']}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.headerCard,
              {
                backgroundColor: isDark ? colors.darkCard : colors.card,
                borderLeftColor: statusColor,
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.billName, { color: isDark ? colors.card : colors.text }]}>
                {bill.name}
              </Text>
              <Text style={[styles.amount, { color: isDark ? colors.card : colors.text }]}>
                {formatCurrency(bill.amount)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor },
              ]}
            >
              <Text style={styles.statusText}>
                {status === 'due' ? 'Due' : status === 'upcoming' ? 'Upcoming' : 'Paid'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <IconSymbol name="calendar" size={18} color={colors.primary} />
                <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                  Due Date
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: isDark ? colors.card : colors.text }]}>
                {formatDate(bill.dueDate)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <IconSymbol name="repeat" size={18} color={colors.primary} />
                <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                  Frequency
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: isDark ? colors.card : colors.text }]}>
                {getFrequencyLabel(bill.frequency)}
              </Text>
            </View>

            {bill.notes && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <IconSymbol name="note.text" size={18} color={colors.primary} />
                  <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                    Notes
                  </Text>
                </View>
                <Text style={[styles.detailValue, { color: isDark ? colors.card : colors.text }]}>
                  {bill.notes}
                </Text>
              </View>
            )}
          </View>

          {isShared && (
            <View style={styles.paidSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.card : colors.text }]}>
                Payment Status
              </Text>

              <View
                style={[
                  styles.paidCard,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    borderColor: bill.paidByUser1 ? colors.highlight : colors.textSecondary,
                  },
                ]}
              >
                <View style={styles.paidCardContent}>
                  <IconSymbol
                    name={bill.paidByUser1 ? 'checkmark.circle.fill' : 'circle'}
                    size={24}
                    color={bill.paidByUser1 ? colors.highlight : colors.textSecondary}
                  />
                  <Text style={[styles.paidCardText, { color: isDark ? colors.card : colors.text }]}>
                    User 1 Paid
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.paidCard,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    borderColor: bill.paidByUser2 ? colors.highlight : colors.textSecondary,
                  },
                ]}
              >
                <View style={styles.paidCardContent}>
                  <IconSymbol
                    name={bill.paidByUser2 ? 'checkmark.circle.fill' : 'circle'}
                    size={24}
                    color={bill.paidByUser2 ? colors.highlight : colors.textSecondary}
                  />
                  <Text style={[styles.paidCardText, { color: isDark ? colors.card : colors.text }]}>
                    User 2 Paid
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.actionContainer}>
            <Pressable
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isPaidByCurrentUser ? colors.highlight : colors.primary,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
              onPress={handleTogglePaid}
              disabled={isLoading}
            >
              <IconSymbol
                name={isPaidByCurrentUser ? 'checkmark.circle.fill' : 'circle'}
                size={20}
                color={colors.card}
              />
              <Text style={styles.toggleButtonText}>
                {isPaidByCurrentUser ? 'Mark as Unpaid' : 'Mark as Paid'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  headerButton: {
    padding: 8,
  },
  headerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  billName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  paidSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  paidCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  paidCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paidCardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 24,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
