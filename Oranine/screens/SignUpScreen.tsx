import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/theme';
import { NavigationProps } from '../types';
import FormInput from '../src/components/FormInput';

export default function SignUpScreen({
  navigate,
}: NavigationProps) {
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const handleSignUp = () => {
    if (
      !username ||
      !contact ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        'Missing information',
        'Complete all the fields.'
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Password error',
        'The passwords do not match.'
      );

      return;
    }

    Alert.alert(
      'Account created',
      'You can now log in.',
      [
        {
          text: 'OK',
          onPress: () => navigate('login'),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Ionicons
            name="fish"
            size={36}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.title}>
          Create Account
        </Text>

        <View style={styles.form}>
          <FormInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <FormInput
            placeholder="Contact Number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />

          <FormInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <FormInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
          >
            <Text style={styles.buttonText}>
              Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigate('login')}
          >
            <Text style={styles.buttonText}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },

  content: {
    flexGrow: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  title: {
    marginTop: 11,
    marginBottom: 23,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },

  form: {
    width: '100%',
    maxWidth: 390,
  },

  signUpButton: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginTop: 7,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.white,
  },

  backButton: {
    paddingHorizontal: 26,
    paddingVertical: 8,
    marginTop: 16,
    alignSelf: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },

  buttonText: {
    color: COLORS.primary,
    fontWeight: '900',
  },
});