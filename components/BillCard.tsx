
import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Bill, BillStatus } from '@/types/bill';
import { getBillStatus, getStatusColor, formatDate, formatCurrency } from '@/utils/billUtils';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

interface BillCardProps {
  bill: Bill;
  onPress: () => void;
  onTogglePaid?: (paidByUser1: boolean, paidByUser2: boolean) => void;
  currentUserId: string;
  isShared: boolean;
}

export default function BillCard({
  bill,
  onPress,
  onTogglePaid,
  currentUserId,
  isShared,
}: BillCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const status = getBillStatus(bill);
  const statusColor = getStatusColor(status);

  const handleTogglePaid = () => {
    if (!onTogglePaid) return;
    
    if (bill.createdBy === currentUserId) {
      // Current user created it, toggle their paid status
      onTogglePaid(!bill.paidByUser1, bill.paidByUser2);
    } else {
      // Other user created it, toggle their paid status
      onTogglePaid(bill.paidByUser1, !bill.paidByUser2);
    }
  };

  const isPaidByCurrentUser = bill.createdBy === currentUserId ? bill.paidByUser1 : bill.paidByUser2;

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.darkCard : colors.card,
            borderLeftColor: statusColor,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text
              style={[
                styles.billName,
                { color: isDark ? colors.card : colors.text },
              ]}
              numberOfLines={1}
            >
              {bill.name}
            </Text>
            <Text
              style={[
                styles.dueDate,
                { color: isDark ? colors.textSecondary : colors.textSecondary },
              ]}
            >
              Due: {formatDate(bill.dueDate)}
            </Text>
          </View>
          <View style={styles.amountSection}>
            <Text
              style={[
                styles.amount,
                { color: isDark ? colors.card : colors.text },
              ]}
            >
              {formatCurrency(bill.amount)}
            </Text>
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
        </View>

        {isShared && (
          <View style={styles.paidBySection}>
            <Pressable
              style={[
                styles.paidByButton,
                {
                  backgroundColor: isPaidByCurrentUser
                    ? colors.highlight
                    : isDark
                    ? colors.darkCard
                    : '#f0f0f0',
                  borderColor: colors.highlight,
                },
              ]}
              onPress={handleTogglePaid}
            >
              <IconSymbol
                name={isPaidByCurrentUser ? 'checkmark.circle.fill' : 'circle'}
                size={16}
                color={isPaidByCurrentUser ? colors.card : colors.textSecondary}
              />
              <Text
                style={[
                  styles.paidByText,
                  {
                    color: isPaidByCurrentUser ? colors.card : colors.textSecondary,
                  },
                ]}
              >
                You
              </Text>
            </Pressable>

            {bill.paidByUser1 && bill.paidByUser2 && (
              <View style={styles.bothPaidBadge}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.highlight} />
                <Text style={styles.bothPaidText}>Both Paid</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 13,
    marginBottom: 4,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
  },
  paidBySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidByButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  paidByText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bothPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderRadius: 6,
  },
  bothPaidText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.highlight,
  },
});
