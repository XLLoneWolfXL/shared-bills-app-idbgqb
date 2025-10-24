
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, useColorScheme, Pressable, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useBillContext } from '@/contexts/BillContext';
import { colors } from '@/styles/commonStyles';
import { User } from '@/types/bill';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const {
    currentUser,
    setCurrentUser,
    sharedConnection,
    generateCode,
    connectWithCode,
    acceptConnection,
    disconnect,
  } = useBillContext();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.name || '');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeDisplay, setShowCodeDisplay] = useState(false);

  useEffect(() => {
    console.log('Profile screen - useEffect triggered, currentUser:', currentUser);
    if (currentUser) {
      setEditedName(currentUser.name);
      console.log('Profile screen - currentUser updated:', currentUser);
      setIsLoading(false);
    } else {
      console.log('Profile screen - no currentUser');
    }
  }, [currentUser]);

  // Refresh profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('Profile screen focused - currentUser:', currentUser);
      if (currentUser) {
        setEditedName(currentUser.name);
        console.log('Profile screen focused - updated editedName to:', currentUser.name);
      } else {
        console.log('Profile screen focused - no currentUser');
      }
    }, [currentUser])
  );

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!currentUser) return;

    try {
      setIsLoading(true);
      console.log('Saving name for user:', currentUser.id);
      const updatedUser: User = {
        ...currentUser,
        name: editedName.trim(),
      };
      await setCurrentUser(updatedUser);
      console.log('Name saved successfully');
      setIsEditingName(false);
      Alert.alert('Success', 'Name updated successfully');
    } catch (error) {
      console.log('Error saving name:', error);
      Alert.alert('Error', 'Failed to save name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setIsLoading(true);
      const code = await generateCode();
      setGeneratedCode(code);
      setShowCodeDisplay(true);
    } catch (error) {
      console.log('Error generating code:', error);
      Alert.alert('Error', 'Failed to generate code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWithCode = async () => {
    if (!connectionCode.trim()) {
      Alert.alert('Error', 'Please enter a code');
      return;
    }

    try {
      setIsLoading(true);
      const success = await connectWithCode(connectionCode.toUpperCase());
      if (success) {
        Alert.alert('Success', 'Connection request sent! Waiting for the other user to accept.');
        setConnectionCode('');
        setShowCodeInput(false);
      } else {
        Alert.alert('Error', 'Invalid or expired code');
      }
    } catch (error) {
      console.log('Error connecting:', error);
      Alert.alert('Error', 'Failed to connect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    try {
      setIsLoading(true);
      await acceptConnection();
      Alert.alert('Success', 'Connection accepted!');
    } catch (error) {
      console.log('Error accepting connection:', error);
      Alert.alert('Error', 'Failed to accept connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert('Disconnect', 'Are you sure you want to disconnect? Your bills will remain private.', [
      { text: 'Cancel', onPress: () => console.log('Cancel') },
      {
        text: 'Disconnect',
        onPress: async () => {
          try {
            setIsLoading(true);
            await disconnect();
            Alert.alert('Success', 'Disconnected successfully');
          } catch (error) {
            console.log('Error disconnecting:', error);
            Alert.alert('Error', 'Failed to disconnect');
          } finally {
            setIsLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', onPress: () => console.log('Cancel') },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            setIsLoading(true);
            await supabase.auth.signOut();
            Alert.alert('Success', 'Signed out successfully');
          } catch (error) {
            console.log('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
          } finally {
            setIsLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  console.log('Profile screen render - currentUser:', currentUser);
  console.log('Profile screen render - isLoading:', isLoading);
  
  if (!currentUser) {
    console.log('Showing profile creation screen');
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark : colors.background },
        ]}
        edges={['top']}
      >
        <View style={styles.setupContainer}>
          <IconSymbol name="person.crop.circle.badge.exclamationmark" size={48} color={colors.primary} />
          <Text style={[styles.setupTitle, { color: isDark ? colors.card : colors.text }]}>
            Set Up Your Profile
          </Text>
          <Text style={[styles.setupText, { color: colors.textSecondary }]}>
            Create your profile to start tracking bills
          </Text>

          <View style={styles.setupForm}>
            <Text style={[styles.label, { color: isDark ? colors.card : colors.text }]}>
              Your Name
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
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              value={editedName}
              onChangeText={setEditedName}
            />

            <Pressable
              style={[styles.setupButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
              onPress={async () => {
                if (!editedName.trim()) {
                  Alert.alert('Error', 'Please enter your name');
                  return;
                }
                try {
                  setIsLoading(true);
                  console.log('Create profile button pressed');
                  
                  const { data: { user: authUser } } = await supabase.auth.getUser();
                  console.log('Auth user:', authUser?.id);
                  
                  if (!authUser) {
                    Alert.alert('Error', 'You must be logged in to create a profile');
                    setIsLoading(false);
                    return;
                  }

                  const newUser: User = {
                    id: authUser.id,
                    name: editedName.trim(),
                    email: authUser.email || '',
                  };
                  
                  console.log('Calling setCurrentUser with:', newUser);
                  await setCurrentUser(newUser);
                  console.log('Profile created successfully');
                  
                  Alert.alert('Success', 'Profile created successfully!');
                } catch (error) {
                  console.log('Error creating profile:', error);
                  console.log('Error details:', error instanceof Error ? error.message : JSON.stringify(error));
                  const errorMessage = error instanceof Error ? error.message : 'Failed to create profile. Please try again.';
                  Alert.alert('Error', errorMessage);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <Text style={styles.setupButtonText}>
                {isLoading ? 'Creating...' : 'Create Profile'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
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
        {/* Profile Section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.darkCard : colors.card,
            },
          ]}
        >
          <View style={styles.profileHeader}>
            <IconSymbol name="person.circle.fill" size={64} color={colors.primary} />
            <View style={styles.profileInfo}>
              {isEditingName ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    style={[
                      styles.nameInput,
                      {
                        backgroundColor: isDark ? colors.dark : colors.background,
                        color: isDark ? colors.card : colors.text,
                        borderColor: colors.primary,
                      },
                    ]}
                    value={editedName}
                    onChangeText={setEditedName}
                    autoFocus
                  />
                  <Pressable
                    style={styles.saveNameButton}
                    onPress={handleSaveName}
                  >
                    <IconSymbol name="checkmark" size={20} color={colors.highlight} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.nameContainer}
                  onPress={() => setIsEditingName(true)}
                >
                  <Text style={[styles.name, { color: isDark ? colors.card : colors.text }]}>
                    {currentUser.name}
                  </Text>
                  <IconSymbol name="pencil" size={16} color={colors.primary} />
                </Pressable>
              )}
              <Text style={[styles.userId, { color: colors.textSecondary }]}>
                ID: {currentUser.id.substring(0, 8)}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <Pressable
            style={[styles.logoutButton, { borderColor: colors.due, opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <IconSymbol name="arrow.right.circle" size={20} color={colors.due} />
            <Text style={[styles.logoutButtonText, { color: colors.due }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* Connection Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.card : colors.text }]}>
            Shared Bills
          </Text>

          {sharedConnection ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.darkCard : colors.card,
                },
              ]}
            >
              <View style={styles.connectionStatus}>
                <IconSymbol
                  name={
                    sharedConnection.user1Accepted && sharedConnection.user2Accepted
                      ? 'checkmark.circle.fill'
                      : 'clock.fill'
                  }
                  size={24}
                  color={
                    sharedConnection.user1Accepted && sharedConnection.user2Accepted
                      ? colors.highlight
                      : colors.accent
                  }
                />
                <View style={styles.connectionInfo}>
                  <Text style={[styles.connectionTitle, { color: isDark ? colors.card : colors.text }]}>
                    {sharedConnection.user1Accepted && sharedConnection.user2Accepted
                      ? 'Connected'
                      : 'Pending Acceptance'}
                  </Text>
                  <Text style={[styles.connectionSubtitle, { color: colors.textSecondary }]}>
                    {sharedConnection.user1Accepted && sharedConnection.user2Accepted
                      ? 'Both users have accepted'
                      : 'Waiting for other user to accept'}
                  </Text>
                </View>
              </View>

              {!sharedConnection.user1Accepted || !sharedConnection.user2Accepted ? (
                <Pressable
                  style={[styles.acceptButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
                  onPress={handleAcceptConnection}
                  disabled={isLoading}
                >
                  <Text style={styles.acceptButtonText}>
                    {isLoading ? 'Accepting...' : 'Accept Connection'}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                style={[styles.disconnectButton, { borderColor: colors.due, opacity: isLoading ? 0.6 : 1 }]}
                onPress={handleDisconnect}
                disabled={isLoading}
              >
                <Text style={[styles.disconnectButtonText, { color: colors.due }]}>
                  Disconnect
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.darkCard : colors.card,
                },
              ]}
            >
              <Text style={[styles.noConnectionText, { color: colors.textSecondary }]}>
                Not connected yet. Generate or enter a code to share bills with another user.
              </Text>

              <View style={styles.connectionButtonsContainer}>
                <Pressable
                  style={[styles.connectionButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
                  onPress={handleGenerateCode}
                  disabled={isLoading}
                >
                  <IconSymbol name="qrcode" size={20} color={colors.card} />
                  <Text style={styles.connectionButtonText}>
                    {isLoading ? 'Generating...' : 'Generate Code'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.connectionButton, { backgroundColor: colors.secondary, opacity: isLoading ? 0.6 : 1 }]}
                  onPress={() => setShowCodeInput(!showCodeInput)}
                  disabled={isLoading}
                >
                  <IconSymbol name="checkmark.circle" size={20} color={colors.card} />
                  <Text style={styles.connectionButtonText}>
                    Enter Code
                  </Text>
                </Pressable>
              </View>

              {showCodeDisplay && generatedCode && (
                <View
                  style={[
                    styles.codeDisplay,
                    {
                      backgroundColor: isDark ? colors.dark : colors.background,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
                    Share this code (expires in 24 hours):
                  </Text>
                  <Text style={[styles.code, { color: isDark ? colors.card : colors.text }]}>
                    {generatedCode}
                  </Text>
                  <Pressable
                    style={[styles.copyButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Alert.alert('Copied', 'Code copied to clipboard');
                    }}
                  >
                    <IconSymbol name="doc.on.doc" size={16} color={colors.card} />
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </Pressable>
                </View>
              )}

              {showCodeInput && (
                <View style={styles.codeInputContainer}>
                  <TextInput
                    style={[
                      styles.codeInput,
                      {
                        backgroundColor: isDark ? colors.dark : colors.background,
                        color: isDark ? colors.card : colors.text,
                        borderColor: colors.primary,
                      },
                    ]}
                    placeholder="Enter 6-8 character code"
                    placeholderTextColor={colors.textSecondary}
                    value={connectionCode}
                    onChangeText={setConnectionCode}
                    maxLength={8}
                    autoCapitalize="characters"
                  />
                  <Pressable
                    style={[styles.submitCodeButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
                    onPress={handleConnectWithCode}
                    disabled={isLoading}
                  >
                    <Text style={styles.submitCodeButtonText}>
                      {isLoading ? 'Connecting...' : 'Connect'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  setupText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  setupForm: {
    width: '100%',
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
    marginBottom: 16,
  },
  setupButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  setupButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
  },
  saveNameButton: {
    padding: 6,
  },
  userId: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  connectionSubtitle: {
    fontSize: 13,
  },
  acceptButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noConnectionText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  connectionButtonsContainer: {
    gap: 8,
  },
  connectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  connectionButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  codeDisplay: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  code: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  copyButtonText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  codeInputContainer: {
    marginTop: 12,
    gap: 8,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  submitCodeButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitCodeButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
