
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NavigationProps } from '../types';
import {
  loginFarmer,
  requestPasswordReset,
  confirmPasswordReset,
} from '../src/api';

const COLORS = {
  background: '#F8F7FA',
  primary: '#67318A',
  lavender: '#CDA0F2',
  lightLavender: '#F3E8FC',
  white: '#FFFFFF',
  text: '#30243A',
  muted: '#63586D',
  border: '#E8E1EC',
  error: '#B42318',
  success: '#237A55',
};

type ScreenMode = 'login' | 'forgot' | 'reset';

export default function LoginScreen({
  navigate,
}: NavigationProps) {
  const [mode, setMode] = useState<ScreenMode>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [email, setEmail] = useState('');

  const [resetUid, setResetUid] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<
    'success' | 'error'
  >('success');

  // Recognize reset links opened on Expo web.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const params = new URLSearchParams(
      window.location.search
    );

    const uid = params.get('reset_uid');
    const token = params.get('reset_token');

    if (uid && token) {
      setResetUid(uid);
      setResetToken(token);
      setMode('reset');
    }
  }, []);

  const showMessage = (
    title: string,
    message: string
  ) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const setNotice = (
    message: string,
    type: 'success' | 'error'
  ) => {
    setFeedback(message);
    setFeedbackType(type);
  };

  const clearNotice = () => {
    setFeedback('');
  };

  const goToLogin = () => {
    setMode('login');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetUid('');
    setResetToken('');
    clearNotice();

    if (Platform.OS === 'web') {
      window.history.replaceState(
        {},
        '',
        window.location.pathname
      );
    }
  };

  const handleLogin = async () => {
    if (loading) return;

    if (!username.trim() || !password) {
      setNotice(
        'Please enter your username and password.',
        'error'
      );
      return;
    }

    try {
      setLoading(true);
      clearNotice();

      await loginFarmer({
        username: username.trim(),
        password,
      });

      setPassword('');
      navigate('dashboard');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.';

      setNotice(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setNotice(
        'Please enter your registered email address.',
        'error'
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      setNotice(
        'Please enter a valid email address.',
        'error'
      );
      return;
    }

    try {
      setLoading(true);
      clearNotice();

      await requestPasswordReset(cleanEmail);

      setNotice(
        'If an account is registered with this email, password reset instructions have been sent. During local testing, check the Django terminal for the link.',
        'success'
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Unable to request a reset link.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;

    if (!newPassword || !confirmPassword) {
      setNotice(
        'Please complete both password fields.',
        'error'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice(
        'Your passwords do not match.',
        'error'
      );
      return;
    }

    if (newPassword.length < 8) {
      setNotice(
        'Your new password must have at least 8 characters.',
        'error'
      );
      return;
    }

    if (!resetUid || !resetToken) {
      setNotice(
        'The password reset link is missing or invalid.',
        'error'
      );
      return;
    }

    try {
      setLoading(true);
      clearNotice();

      await confirmPasswordReset({
        uid: resetUid,
        token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      goToLogin();

      showMessage(
        'Password Reset Successful',
        'Your password has been updated. Please sign in using your new password.'
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Unable to reset your password.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFeedback = () => {
    if (!feedback) return null;

    return (
      <View
        style={[
          styles.feedback,
          feedbackType === 'error'
            ? styles.errorFeedback
            : styles.successFeedback,
        ]}
      >
        <Ionicons
          name={
            feedbackType === 'error'
              ? 'alert-circle-outline'
              : 'checkmark-circle-outline'
          }
          size={22}
          color={
            feedbackType === 'error'
              ? COLORS.error
              : COLORS.success
          }
        />

        <Text
          style={[
            styles.feedbackText,
            {
              color:
                feedbackType === 'error'
                  ? COLORS.error
                  : COLORS.success,
            },
          ]}
        >
          {feedback}
        </Text>
      </View>
    );
  };

  const renderLogin = () => (
    <>
      <Text style={styles.heading}>Welcome back!</Text>

      <Text style={styles.description}>
        Sign in to monitor your tilapia pond's water
        quality.
      </Text>

      <Text style={styles.label}>Username</Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="person-outline"
          size={21}
          color={COLORS.muted}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          placeholderTextColor="#948A9D"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          accessibilityLabel="Username"
        />
      </View>

      <Text style={styles.label}>Password</Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={21}
          color={COLORS.muted}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#948A9D"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
          accessibilityLabel="Password"
        />

        <TouchableOpacity
          onPress={() =>
            setShowPassword(!showPassword)
          }
          accessibilityLabel={
            showPassword
              ? 'Hide password'
              : 'Show password'
          }
        >
          <Ionicons
            name={
              showPassword
                ? 'eye-off-outline'
                : 'eye-outline'
            }
            size={22}
            color={COLORS.muted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.forgotLink}
        onPress={() => {
          clearNotice();
          setMode('forgot');
        }}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      {renderFeedback()}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleLogin}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              Sign In
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={COLORS.white}
            />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
        </Text>

        <TouchableOpacity
          onPress={() => navigate('signup')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderForgotPassword = () => (
    <>
      <View style={styles.featureIcon}>
        <Ionicons
          name="mail-outline"
          size={32}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.heading}>
        Forgot Password?
      </Text>

      <Text style={styles.description}>
        Enter your registered email address and
        we'll send you a link to reset your password.
      </Text>

      <Text style={styles.label}>Email Address</Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={21}
          color={COLORS.muted}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          placeholderTextColor="#948A9D"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
          accessibilityLabel="Registered email address"
        />
      </View>

      {renderFeedback()}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleForgotPassword}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              Send Reset Link
            </Text>
            <Ionicons
              name="send-outline"
              size={20}
              color={COLORS.white}
            />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backLink}
        onPress={goToLogin}
        disabled={loading}
      >
        <Ionicons
          name="arrow-back"
          size={19}
          color={COLORS.primary}
        />
        <Text style={styles.linkText}>
          Back to Sign In
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderResetPassword = () => (
    <>
      <View style={styles.featureIcon}>
        <Ionicons
          name="shield-checkmark-outline"
          size={32}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.heading}>
        Create New Password
      </Text>

      <Text style={styles.description}>
        Enter a new password for your Oranine
        account.
      </Text>

      <Text style={styles.label}>New Password</Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={21}
          color={COLORS.muted}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor="#948A9D"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          editable={!loading}
          accessibilityLabel="New password"
        />

        <TouchableOpacity
          onPress={() =>
            setShowNewPassword(!showNewPassword)
          }
        >
          <Ionicons
            name={
              showNewPassword
                ? 'eye-off-outline'
                : 'eye-outline'
            }
            size={22}
            color={COLORS.muted}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>
        Confirm New Password
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={21}
          color={COLORS.muted}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor="#948A9D"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showNewPassword}
          editable={!loading}
          accessibilityLabel="Confirm new password"
        />
      </View>

      <Text style={styles.passwordHint}>
        Use at least 8 characters. Avoid common or
        easily guessed passwords.
      </Text>

      {renderFeedback()}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleResetPassword}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.primaryButtonText}>
            Reset Password
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backLink}
        onPress={goToLogin}
        disabled={loading}
      >
        <Ionicons
          name="arrow-back"
          size={19}
          color={COLORS.primary}
        />
        <Text style={styles.linkText}>
          Back to Sign In
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandSection}>
          <View style={styles.logo}>
            <Ionicons
              name="fish"
              size={45}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.brandName}>
            Oranine
          </Text>

          <Text style={styles.brandSubtitle}>
            Smart Tilapia Water Monitoring
          </Text>
        </View>

        <View style={styles.card}>
          {mode === 'login' && renderLogin()}
          {mode === 'forgot' &&
            renderForgotPassword()}
          {mode === 'reset' &&
            renderResetPassword()}
        </View>

        <Text style={styles.bottomText}>
          Helping fish farmers monitor water quality
          with confidence.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 38,
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logo: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: COLORS.lightLavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },

  brandSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 5,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 25,
    paddingVertical: 30,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0px 8px 28px rgba(70, 37, 94, 0.07)',
        }
      : {
          elevation: 3,
        }),
  },

  heading: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 9,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 9,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 55,
    backgroundColor: '#FCFAFE',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    marginBottom: 19,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 0,
  },

  forgotLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginTop: -10,
    marginBottom: 15,
  },

  linkText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  primaryButton: {
    minHeight: 55,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 18,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.6,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 27,
  },

  footerText: {
    fontSize: 15,
    color: COLORS.muted,
  },

  featureIcon: {
    alignSelf: 'center',
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: COLORS.lightLavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
  },

  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    borderRadius: 12,
    marginBottom: 12,
  },

  errorFeedback: {
    backgroundColor: '#FFF0EE',
  },

  successFeedback: {
    backgroundColor: '#EAF8F0',
  },

  feedbackText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },

  backLink: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 16,
  },

  passwordHint: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.muted,
    marginTop: -6,
    marginBottom: 10,
  },

  bottomText: {
    marginTop: 23,
    maxWidth: 340,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});
