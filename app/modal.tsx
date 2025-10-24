import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/app/integrations/supabase/client';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Signing up with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed'
        }
      });

      if (error) {
        console.log('Sign up error:', error);
        Alert.alert('Sign Up Error', error.message);
        return;
      }

      console.log('Sign up successful:', data);
      
      if (data.user?.identities?.length === 0) {
        Alert.alert('Error', 'This email is already registered. Please sign in instead.');
        setIsSignUp(false);
        return;
      }

      Alert.alert('Success', 'Account created! Please check your email to verify your account. You can sign in after verification.');
      setEmail('');
      setPassword('');
      setIsSignUp(false);
    } catch (error) {
      console.log('Sign up exception:', error);
      Alert.alert('Error', 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Signing in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.log('Sign in error:', error);
        if (error.message.includes('Email not confirmed')) {
          Alert.alert('Email Not Verified', 'Please check your email and verify your account before signing in.');
        } else {
          Alert.alert('Sign In Error', error.message);
        }
        return;
      }

      console.log('Sign in successful:', data);
      setEmail('');
      setPassword('');
      // The auth state change listener will handle navigation
    } catch (error) {
      console.log('Sign in exception:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark : colors.background },
      ]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconSymbol name="creditcard" size={64} color={colors.primary} />
          <Text style={[styles.title, { color: isDark ? colors.card : colors.text }]}>
            Bills
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSignUp ? 'Create an account' : 'Sign in to your account'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? colors.card : colors.text }]}>
              Email
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
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? colors.card : colors.text }]}>
              Password
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
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 },
            ]}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.toggleButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setEmail('');
              setPassword('');
            }}
            disabled={isLoading}
          >
            <Text style={[styles.toggleButtonText, { color: colors.primary }]}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </Pressable>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
