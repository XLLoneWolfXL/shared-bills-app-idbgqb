
import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBillContext } from '@/contexts/BillContext';
import { colors } from '@/styles/commonStyles';
import { Bill, BillFrequency } from '@/types/bill';
import { generateId } from '@/utils/billUtils';
import { IconSymbol } from '@/components/IconSymbol';

export default function AddBillScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentUser, addBill } = useBillContext();

  const [billName, setBillName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleAddBill = async () => {
    if (!billName.trim()) {
      Alert.alert('Error', 'Please enter a bill name');
      return;
    }

    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setIsLoading(true);

      const newBill: Bill = {
        id: generateId(),
        name: billName.trim(),
        amount: parseFloat(amount),
        dueDate: dueDate.toISOString(),
        notes: notes.trim() || undefined,
        frequency,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        paidByUser1: false,
        paidByUser2: false,
      };

      await addBill(newBill);
      Alert.alert('Success', 'Bill added successfully');
      router.back();
    } catch (error) {
      console.log('Error adding bill:', error);
      Alert.alert('Error', 'Failed to add bill');
    } finally {
      setIsLoading(false);
    }
  };

  const frequencyOptions: BillFrequency[] = ['one-time', 'weekly', 'monthly'];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Bill',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <IconSymbol name="chevron.left" color={colors.primary} size={24} />
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
          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? colors.card : colors.text }]}>
              Bill Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.darkCard : colors.card,
                  color: isDark ? colors.card : colors.text,
                  borderColor: colors.primary,
                },
              ]}
              placeholder="e.g., Electric, Rent"
              placeholderTextColor={colors.textSecondary}
              value={billName}
              onChangeText={setBillName}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? colors.card : colors.text }]}>
              Amount *
            </Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, { color: isDark ? colors.card : colors.text }]}>
                $
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: isDark ? colors.darkCard : colors.card,
                    color: isDark ? colors.card : colors.text,
                    borderColor: colors.primary,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? colors.card : colors.text }]}>
              Due Date *
            </Text>
            <Pressable
              style={[
                styles.dateButton,
                {
                  backgroundColor: isDark ? colors.darkCard : colors.card,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" color={colors.primary} size={20} />
              <Text style={[styles.dateButtonText, { color: isDark ? colors.card : colors.text }]}>
                {dueDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? colors.card : colors.text }]}>
              Frequency
            </Text>
            <View style={styles.frequencyContainer}>
              {frequencyOptions.map((freq) => (
                <Pressable
                  key={freq}
                  style={[
                    styles.frequencyButton,
                    {
                      backgroundColor:
                        frequency === freq ? colors.primary : isDark ? colors.darkCard : colors.card,
                      borderColor: frequency === freq ? colors.primary : colors.textSecondary,
                    },
                  ]}
                  onPress={() => setFrequency(freq)}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      {
                        color: frequency === freq ? colors.card : isDark ? colors.card : colors.text,
                      },
                    ]}
                  >
                    {freq === 'one-time' ? 'One-time' : freq === 'weekly' ? 'Weekly' : 'Monthly'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: isDark ? colors.card : colors.text }]}>
              Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: isDark ? colors.darkCard : colors.card,
                  color: isDark ? colors.card : colors.text,
                  borderColor: colors.primary,
                },
              ]}
              placeholder="e.g., account number, payment method"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.secondary }]}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.secondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.addButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
              onPress={handleAddBill}
              disabled={isLoading}
            >
              <Text style={styles.addButtonText}>
                {isLoading ? 'Adding...' : 'Add Bill'}
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.primary,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 0,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  frequencyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
});
