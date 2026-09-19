import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/theme';
import { NavigationProps } from '../types';
import FormInput from '../src/components/FormInput';

export default function LoginScreen({
  navigate,
}: NavigationProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(
        'Missing information',
        'Enter your username and password.'
      );

      return;
    }

    navigate('dashboard');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.logo}>
        <Ionicons
          name="fish"
          size={42}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.title}>Welcome!</Text>

      <View style={styles.form}>
        <FormInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <FormInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.question}>
          Don't have an account?
        </Text>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => navigate('signup')}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },

  logo: {
    width: 75,
    height: 75,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  title: {
    marginTop: 12,
    marginBottom: 25,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },

  form: {
    width: '100%',
    maxWidth: 390,
  },

  forgotPassword: {
    marginTop: -5,
    marginBottom: 15,
    color: COLORS.white,
    fontSize: 10,
    textAlign: 'right',
  },

  loginButton: {
    minWidth: 115,
    paddingVertical: 11,
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.white,
  },

  buttonText: {
    color: COLORS.primary,
    fontWeight: '900',
  },

  question: {
    marginTop: 30,
    marginBottom: 9,
    color: COLORS.white,
    fontSize: 11,
    textAlign: 'center',
  },

  signUpButton: {
    paddingHorizontal: 25,
    paddingVertical: 8,
    alignSelf: 'center',
    borderRadius: 17,
    backgroundColor: COLORS.white,
  },
});