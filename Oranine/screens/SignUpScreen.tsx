
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NavigationProps } from '../types';
import { registerFarmer } from '../src/api';

const COLORS = {
  background: '#F8F7FA',
  white: '#FFFFFF',
  purple: '#67318A',
  lightPurple: '#F2E8FC',
  text: '#30243A',
  muted: '#70647B',
  border: '#E8E1EC',
  input: '#FAF8FC',
  error: '#C62828',
  errorBackground: '#FFF0EE',
  success: '#087D57',
  successBackground: '#E8F7EF',
};

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  editable?: boolean;
  maxLength?: number;
};

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  maxLength,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={COLORS.muted}
          style={styles.inputIcon}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#988BA3"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={
            secureTextEntry && !showPassword
          }
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() =>
              setShowPassword(!showPassword)
            }
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword
                ? `Hide ${label}`
                : `Show ${label}`
            }
          >
            <Ionicons
              name={
                showPassword
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={23}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function SignUpScreen({
  navigate,
}: NavigationProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');
  const [successMessage, setSuccessMessage] =
    useState('');

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSignUp = async () => {
    if (loading) return;

    clearMessages();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanContact = contact.trim();

    if (
      !cleanUsername ||
      !cleanEmail ||
      !cleanContact ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage(
        'Please complete all fields before creating your account.'
      );
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      setErrorMessage(
        'Please enter a valid email address.'
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        'Your password must contain at least 8 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        'Your passwords do not match. Please try again.'
      );
      return;
    }

    try {
      setLoading(true);

      await registerFarmer({
        username: cleanUsername,
        email: cleanEmail,
        contact: cleanContact,
        password,
        confirm_password: confirmPassword,
      });

      setPassword('');
      setConfirmPassword('');

      setSuccessMessage(
        'Account created successfully! You can now sign in.'
      );

      // Keep the success message visible briefly
      // before returning to the Sign In screen.
      setTimeout(() => {
        navigate('login');
      }, 1400);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

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
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isSmallScreen
              ? 16
              : 24,
            paddingVertical: isSmallScreen
              ? 30
              : 46,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContent}>
          {/* ORANINE BRAND */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Ionicons
                name="fish"
                size={45}
                color={COLORS.purple}
              />
            </View>

            <Text style={styles.brandName}>
              Oranine
            </Text>

            <Text style={styles.brandSubtitle}>
              Smart Tilapia Water Monitoring
            </Text>
          </View>

          {/* SIGN UP CARD */}
          <View
            style={[
              styles.card,
              isSmallScreen && styles.cardMobile,
            ]}
          >
            <View style={styles.headerIcon}>
              <Ionicons
                name="person-add-outline"
                size={34}
                color={COLORS.purple}
              />
            </View>

            <Text style={styles.cardTitle}>
              Create Account
            </Text>

            <Text style={styles.cardSubtitle}>
              Register to monitor your tilapia
              pond's water quality.
            </Text>

            {/* USERNAME */}
            <InputField
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              icon="person-outline"
              editable={!loading}
            />

            {/* EMAIL */}
            <InputField
              label="Email Address"
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              keyboardType="email-address"
              editable={!loading}
            />

            {/* CONTACT */}
            <InputField
              label="Contact Number"
              placeholder="Enter your contact number"
              value={contact}
              onChangeText={setContact}
              icon="call-outline"
              keyboardType="phone-pad"
              editable={!loading}
              maxLength={20}
            />

            {/* PASSWORD */}
            <InputField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              icon="lock-closed-outline"
              secureTextEntry
              editable={!loading}
            />

            {/* CONFIRM PASSWORD */}
            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon="lock-closed-outline"
              secureTextEntry
              editable={!loading}
            />

            <Text style={styles.passwordHint}>
              Use at least 8 characters. Avoid
              common or easily guessed passwords.
            </Text>

            {/* ERROR MESSAGE */}
            {!!errorMessage && (
              <View
                style={[
                  styles.messageBox,
                  styles.errorBox,
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color={COLORS.error}
                />

                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* SUCCESS MESSAGE */}
            {!!successMessage && (
              <View
                style={[
                  styles.messageBox,
                  styles.successBox,
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={COLORS.success}
                />

                <Text style={styles.successText}>
                  {successMessage}
                </Text>
              </View>
            )}

            {/* CREATE ACCOUNT BUTTON */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleSignUp}
              disabled={loading || !!successMessage}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.white}
                />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.submitText}>
                    Create Account
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={23}
                    color={COLORS.white}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* BACK TO SIGN IN */}
            <TouchableOpacity
              style={styles.signInRow}
              onPress={() => navigate('login')}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Back to Sign In"
            >
              <Text style={styles.signInText}>
                Already have an account?{' '}
              </Text>

              <Text style={styles.signInLink}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <Text style={styles.footer}>
            Helping fish farmers monitor water
            quality with confidence.
          </Text>
        </View>
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
  },

  pageContent: {
    width: '100%',
    maxWidth: 530,
    alignItems: 'center',
  },

  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logoBox: {
    width: 105,
    height: 105,
    borderRadius: 32,
    backgroundColor: COLORS.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  brandName: {
    color: COLORS.purple,
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
  },

  brandSubtitle: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },

  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 30,
    paddingVertical: 35,
    alignItems: 'stretch',

    ...Platform.select({
      web: {
        boxShadow:
          '0px 10px 32px rgba(48, 36, 58, 0.08)',
      } as any,

      default: {
        elevation: 3,
        shadowColor: '#30243A',
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
    }),
  },

  cardMobile: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderRadius: 22,
  },

  headerIcon: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: COLORS.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 29,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 9,
  },

  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    marginBottom: 29,
  },

  fieldGroup: {
    marginBottom: 19,
  },

  fieldLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  inputContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },

  inputFocused: {
    borderColor: COLORS.purple,
    borderWidth: 1.5,
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as any,

  eyeButton: {
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },

  passwordHint: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: -3,
    marginBottom: 20,
  },

  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 14,
    marginBottom: 20,
    gap: 10,
  },

  errorBox: {
    backgroundColor: COLORS.errorBackground,
  },

  successBox: {
    backgroundColor: COLORS.successBackground,
  },

  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 14,
    lineHeight: 22,
  },

  successText: {
    flex: 1,
    color: COLORS.success,
    fontSize: 14,
    lineHeight: 22,
  },

  submitButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 15,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 3,
  },

  disabledButton: {
    opacity: 0.65,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  submitText: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '900',
  },

  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 12,
    marginTop: 20,
  },

  signInText: {
    color: COLORS.muted,
    fontSize: 15,
  },

  signInLink: {
    color: COLORS.purple,
    fontSize: 15,
    fontWeight: '800',
  },

  footer: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 10,
  },
});
