
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { COLORS } from '../constants/theme';
import { NavigationProps } from '../types';
import Header from '../src/components/Header';
import BottomNavigation from '../src/components/BottomNavigation';

import {
  getCurrentUser,
  updateFarmerProfile,
  changeFarmerPassword,
  logoutFarmer,
  type AuthUser,
} from '../src/api';

const WEB = {
  primary: '#CDA0F2',
  primaryDark: '#67318A',
  primarySoft: '#F4EAFB',
  background: '#F8F7FA',
  white: '#FFFFFF',
  text: '#30243A',
  muted: '#6D6475',
  border: '#E8E1EC',
  danger: '#B63B54',
};

type IconName = keyof typeof Ionicons.glyphMap;

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function displayValue(
  value: string | number | null | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return 'Not provided';
  }

  return String(value);
}

function formatDate(value?: string): string {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export default function ProfileScreen({
  navigate,
}: NavigationProps) {
  const { width } = useWindowDimensions();

  // Desktop styling applies to WEB ONLY.
  const isDesktop = Platform.OS === 'web' && width >= 900;

  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getCurrentUser();

      setProfile(result);
      setUsername(result.username || '');
      setEmail(result.email || '');
      setContact(
        result.contact ?? result.contact_number ?? ''
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEditProfile = () => {
    if (!profile) return;

    setUsername(profile.username || '');
    setEmail(profile.email || '');
    setContact(
      profile.contact ?? profile.contact_number ?? ''
    );

    setChangingPassword(false);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);

    if (profile) {
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setContact(
        profile.contact ?? profile.contact_number ?? ''
      );
    }
  };

  const handleSaveProfile = async () => {
    if (saving) return;

    if (!username.trim() || !email.trim()) {
      showMessage(
        'Missing Information',
        'Username and email are required.'
      );
      return;
    }

    if (!email.includes('@')) {
      showMessage(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    setSaving(true);

    try {
      const result = await updateFarmerProfile({
        username: username.trim(),
        email: email.trim(),
        contact: contact.trim(),
      });

      setProfile(result.user);
      setUsername(result.user.username || '');
      setEmail(result.user.email || '');
      setContact(
        result.user.contact ??
        result.user.contact_number ??
        ''
      );

      setEditing(false);

      showMessage(
        'Profile Updated',
        'Your profile was saved successfully.'
      );
    } catch (err) {
      showMessage(
        'Update Failed',
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  const clearPasswordFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = () => {
    clearPasswordFields();
    setEditing(false);
    setChangingPassword(true);
  };

  const handleCancelPassword = () => {
    clearPasswordFields();
    setChangingPassword(false);
  };

  const handleSavePassword = async () => {
    if (savingPassword) return;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      showMessage(
        'Missing Information',
        'Please complete all password fields.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(
        'Password Mismatch',
        'The new passwords do not match.'
      );
      return;
    }

    if (currentPassword === newPassword) {
      showMessage(
        'Invalid Password',
        'Your new password must be different from your current password.'
      );
      return;
    }

    setSavingPassword(true);

    try {
      await changeFarmerPassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      clearPasswordFields();
      setChangingPassword(false);

      showMessage(
        'Password Changed',
        'Your password was updated successfully.'
      );
    } catch (err) {
      showMessage(
        'Password Change Failed',
        getErrorMessage(err)
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutFarmer();
      navigate('login');
    } catch (err) {
      showMessage(
        'Logout Failed',
        getErrorMessage(err)
      );
    } finally {
      setLoggingOut(false);
    }
  };

  // --------------------------------------------------
  // SHARED COMPONENTS
  // --------------------------------------------------

  const InfoField = ({
    icon,
    label,
    value,
  }: {
    icon: IconName;
    label: string;
    value: string;
  }) => (
    <View
      style={[
        styles.field,
        isDesktop && styles.webField,
      ]}
    >
      <View
        style={[
          styles.fieldIcon,
          isDesktop && styles.webFieldIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={isDesktop ? 21 : 19}
          color={
            isDesktop
              ? WEB.primaryDark
              : COLORS.primary
          }
        />
      </View>

      <View style={styles.fieldContent}>
        <Text
          style={[
            styles.label,
            isDesktop && styles.webLabel,
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.value,
            isDesktop && styles.webValue,
          ]}
          selectable
        >
          {value}
        </Text>
      </View>
    </View>
  );

  const ActionButton = ({
    label,
    icon,
    onPress,
    secondary = false,
    disabled = false,
  }: {
    label: string;
    icon: IconName;
    onPress: () => void;
    secondary?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        secondary
          ? styles.secondaryButton
          : styles.primaryButton,
        isDesktop &&
          (secondary
            ? styles.webSecondaryButton
            : styles.webPrimaryButton),
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={isDesktop ? 20 : 18}
        color={
          isDesktop
            ? secondary
              ? WEB.primaryDark
              : WEB.white
            : secondary
              ? COLORS.primary
              : COLORS.white
        }
      />

      <Text
        style={[
          secondary
            ? styles.secondaryButtonText
            : styles.primaryButtonText,
          isDesktop &&
            (secondary
              ? styles.webSecondaryButtonText
              : styles.webPrimaryButtonText),
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ProfileAvatar = () => (
    <View
      style={[
        styles.avatarContainer,
        isDesktop && styles.webAvatarContainer,
      ]}
    >
      <View
        style={[
          styles.avatar,
          isDesktop && styles.webAvatar,
        ]}
      >
        <Ionicons
          name="person"
          size={isDesktop ? 28 : 38}
          color={
            isDesktop
              ? WEB.primaryDark
              : COLORS.white
          }
        />
      </View>

      <View
        style={[
          isDesktop && styles.webAvatarText,
        ]}
      >
        <Text
          style={[
            styles.username,
            isDesktop && styles.webUsername,
          ]}
        >
          {displayValue(profile?.username)}
        </Text>

        <Text
          style={[
            styles.email,
            isDesktop && styles.webEmail,
          ]}
        >
          {displayValue(profile?.email)}
        </Text>
      </View>
    </View>
  );

  const PersonalInformation = () => (
    <View
      style={[
        styles.section,
        isDesktop && styles.webSection,
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          isDesktop && styles.webSectionTitle,
        ]}
      >
        Personal Information
      </Text>

      <InfoField
        icon="person-outline"
        label="Username"
        value={displayValue(profile?.username)}
      />

      <InfoField
        icon="mail-outline"
        label="Email Address"
        value={displayValue(profile?.email)}
      />

      <InfoField
        icon="call-outline"
        label="Contact Number"
        value={displayValue(
          profile?.contact ?? profile?.contact_number
        )}
      />
    </View>
  );

  const AccountInformation = () => (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          isDesktop && styles.webSectionTitle,
        ]}
      >
        Account Information
      </Text>

      <InfoField
        icon="calendar-outline"
        label="Account Created"
        value={formatDate(profile?.date_joined)}
      />
    </View>
  );

  const LogoutButton = () => (
    <TouchableOpacity
      style={[
        styles.logoutButton,
        isDesktop && styles.webLogoutButton,
        loggingOut && styles.disabledButton,
      ]}
      onPress={handleLogout}
      disabled={loggingOut}
      accessibilityRole="button"
      accessibilityLabel="Log Out"
    >
      {loggingOut ? (
        <ActivityIndicator
          color={COLORS.white}
        />
      ) : (
        <Ionicons
          name="log-out-outline"
          size={20}
          color={
            isDesktop
              ? WEB.danger
              : COLORS.white
          }
        />
      )}

      <Text
        style={[
          styles.logoutText,
          isDesktop && styles.webLogoutText,
        ]}
      >
        {loggingOut
          ? 'Logging Out...'
          : 'Log Out'}
      </Text>
    </TouchableOpacity>
  );

  const EditForm = () => (
    <View style={styles.formContainer}>
      <Text
        style={[
          styles.sectionTitle,
          isDesktop && styles.webSectionTitle,
        ]}
      >
        Edit Personal Information
      </Text>

      <Text style={styles.inputLabel}>
        Username
      </Text>

      <TextInput
        style={[
          styles.input,
          isDesktop && styles.webInput,
        ]}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
      />

      <Text style={styles.inputLabel}>
        Email Address
      </Text>

      <TextInput
        style={[
          styles.input,
          isDesktop && styles.webInput,
        ]}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email address"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
      />

      <Text style={styles.inputLabel}>
        Contact Number
      </Text>

      <TextInput
        style={[
          styles.input,
          isDesktop && styles.webInput,
        ]}
        value={contact}
        onChangeText={setContact}
        placeholder="Enter contact number"
        keyboardType="phone-pad"
        editable={!saving}
      />

      <ActionButton
        label={
          saving
            ? 'Saving...'
            : 'Save Changes'
        }
        icon="save-outline"
        onPress={handleSaveProfile}
        disabled={saving}
      />

      <ActionButton
        label="Cancel"
        icon="close-outline"
        onPress={handleCancelEdit}
        secondary
        disabled={saving}
      />
    </View>
  );

  const PasswordForm = () => (
    <View style={styles.formContainer}>
      <Text
        style={[
          styles.sectionTitle,
          isDesktop && styles.webSectionTitle,
        ]}
      >
        Change Password
      </Text>

      <Text style={styles.inputLabel}>
        Current Password
      </Text>

      <TextInput
        style={[
          styles.input,
          isDesktop && styles.webInput,
        ]}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Enter current password"
        secureTextEntry
        autoCapitalize="none"
        editable={!savingPassword}
      />

      <Text style={styles.inputLabel}>
        New Password
      </Text>

      <TextInput
        style={[
          styles.input,
          isDesktop && styles.webInput,
        ]}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Enter new password"
        secureTextEntry
        autoCapitalize="none"
        editable={!savingPassword}
      />

      <Text style={styles.inputLabel}>
        Confirm New Password
      </Text>

      <TextInput
        style={[
          styles.input,
          isDesktop && styles.webInput,
        ]}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm new password"
        secureTextEntry
        autoCapitalize="none"
        editable={!savingPassword}
      />

      <Text style={styles.passwordHint}>
        Choose a strong password that meets
        Django's password requirements.
      </Text>

      <ActionButton
        label={
          savingPassword
            ? 'Updating...'
            : 'Update Password'
        }
        icon="lock-closed-outline"
        onPress={handleSavePassword}
        disabled={savingPassword}
      />

      <ActionButton
        label="Cancel"
        icon="close-outline"
        onPress={handleCancelPassword}
        secondary
        disabled={savingPassword}
      />
    </View>
  );

  const StatusContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator
            size="large"
            color={
              isDesktop
                ? WEB.primaryDark
                : COLORS.primary
            }
          />

          <Text style={styles.helperText}>
            Loading your account...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Ionicons
            name="alert-circle-outline"
            size={35}
            color={COLORS.danger}
          />

          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadProfile}
          >
            <Text style={styles.retryText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // --------------------------------------------------
  // WEB ONLY — NEW CLEAN LAYOUT
  // --------------------------------------------------

  const renderDesktop = () => (
    <View style={styles.webPage}>
      <View style={styles.webContent}>
        <View style={styles.webPageHeading}>
          <View>
            <Text style={styles.webPageTitle}>
              My Profile
            </Text>

            <Text style={styles.webPageSubtitle}>
              View and manage your account
            </Text>
          </View>
        </View>

        {loading || error ? (
          <View style={styles.webPanel}>
            <StatusContent />
          </View>
        ) : (
          <View style={styles.webColumns}>
            {/* LEFT CARD */}

            <View style={styles.webLeftColumn}>
              <View style={styles.webPanel}>
                <View style={styles.webPanelHeading}>
                  <Text style={styles.webCardTitle}>
                    Farmer Profile
                  </Text>
                </View>

                <ProfileAvatar />

                <View style={styles.webDivider} />

                <PersonalInformation />
              </View>
            </View>

            {/* RIGHT CARD */}

            <View style={styles.webRightColumn}>
              <View style={styles.webPanel}>
                {editing ? (
                  <EditForm />
                ) : changingPassword ? (
                  <PasswordForm />
                ) : (
                  <>
                    <AccountInformation />

                    <View style={styles.webDivider} />

                    <Text style={styles.webSectionTitle}>
                      Account Settings
                    </Text>

                    <Text
                      style={styles.webSettingsDescription}
                    >
                      Choose an option below to
                      manage your account.
                    </Text>

                    <ActionButton
                      label="Edit Profile"
                      icon="create-outline"
                      onPress={handleEditProfile}
                    />

                    <ActionButton
                      label="Change Password"
                      icon="lock-closed-outline"
                      onPress={handleChangePassword}
                      secondary
                    />

                    <View style={styles.webDivider} />

                    <LogoutButton />
                  </>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // --------------------------------------------------
  // MOBILE — ORIGINAL LAYOUT PRESERVED
  // --------------------------------------------------

  const renderMobile = () => (
    <View style={styles.profileCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          Farmer Profile
        </Text>

        <Ionicons
          name="person-circle-outline"
          size={26}
          color={COLORS.primary}
        />
      </View>

      {loading || error ? (
        <StatusContent />
      ) : (
        <>
          <ProfileAvatar />

          {!editing && !changingPassword && (
            <>
              <PersonalInformation />

              <AccountInformation />

              <View style={styles.actions}>
                <ActionButton
                  label="Edit Profile"
                  icon="create-outline"
                  onPress={handleEditProfile}
                />

                <ActionButton
                  label="Change Password"
                  icon="lock-closed-outline"
                  onPress={handleChangePassword}
                  secondary
                />
              </View>
            </>
          )}

          {editing && <EditForm />}

          {changingPassword && <PasswordForm />}
        </>
      )}

      <LogoutButton />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        subtitle="Your personal information"
      />

      {isDesktop ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.webScrollContent
          }
          keyboardShouldPersistTaps="handled"
        >
          {renderDesktop()}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {renderMobile()}
        </ScrollView>
      )}

      <BottomNavigation
        active="profile"
        navigate={navigate}
      />
    </View>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 12,
    flexGrow: 1,
  },

  // ------------------------------------------------
  // ORIGINAL MOBILE STYLES
  // ------------------------------------------------

  profileCard: {
    flexGrow: 1,
    padding: 17,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    minHeight: 430,
  },

  cardHeader: {
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },

  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  username: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
  },

  email: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  fieldIcon: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldContent: {
    flex: 1,
    marginLeft: 8,
  },

  label: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },

  value: {
    color: COLORS.muted,
    fontSize: 13,
  },

  actions: {
    marginBottom: 20,
    gap: 10,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  secondaryButton: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },

  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '900',
  },

  formContainer: {
    width: '100%',
  },

  inputLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8D1F9',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
  },

  passwordHint: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 16,
  },

  logoutButton: {
    marginTop: 'auto',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    gap: 7,
  },

  logoutText: {
    color: COLORS.white,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.6,
  },

  centerContent: {
    alignItems: 'center',
    paddingVertical: 35,
    gap: 12,
  },

  helperText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
  },

  retryText: {
    color: COLORS.white,
    fontWeight: '800',
  },

  // ------------------------------------------------
  // WEB ONLY — SOFT LAVENDER DESIGN
  // ------------------------------------------------

  webScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 22,
    backgroundColor: WEB.background,
  },

  webPage: {
    width: '100%',
    alignItems: 'center',
  },

  webContent: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },

  webPageHeading: {
    marginBottom: 20,
  },

  webPageTitle: {
    color: WEB.text,
    fontSize: 25,
    fontWeight: '800',
  },

  webPageSubtitle: {
    color: WEB.muted,
    fontSize: 15,
    marginTop: 5,
  },

  webColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    width: '100%',
  },

  webLeftColumn: {
    flex: 1,
    minWidth: 0,
  },

  webRightColumn: {
    flex: 0.9,
    minWidth: 0,
  },

  webPanel: {
    width: '100%',
    backgroundColor: WEB.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WEB.border,
    padding: 22,
  },

  webPanelHeading: {
    marginBottom: 16,
  },

  webCardTitle: {
    color: WEB.text,
    fontSize: 19,
    fontWeight: '800',
  },

  webAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  webAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: WEB.primarySoft,
    marginBottom: 0,
  },

  webAvatarText: {
    flex: 1,
    marginLeft: 14,
  },

  webUsername: {
    fontSize: 18,
    fontWeight: '800',
    color: WEB.text,
  },

  webEmail: {
    fontSize: 14,
    color: WEB.muted,
    marginTop: 4,
  },

  webSection: {
    marginBottom: 0,
  },

  webSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: WEB.primaryDark,
    marginBottom: 12,
  },

  webField: {
    backgroundColor: WEB.background,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 9,
  },

  webFieldIcon: {
    width: 35,
  },

  webLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: WEB.text,
    marginBottom: 4,
  },

  webValue: {
    fontSize: 15,
    color: WEB.muted,
  },

  webDivider: {
    height: 1,
    backgroundColor: WEB.border,
    marginVertical: 18,
  },

  webSettingsDescription: {
    color: WEB.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },

  webPrimaryButton: {
    backgroundColor: WEB.primaryDark,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },

  webPrimaryButtonText: {
    color: WEB.white,
    fontSize: 15,
    fontWeight: '700',
  },

  webSecondaryButton: {
    backgroundColor: WEB.primarySoft,
    borderColor: WEB.primary,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },

  webSecondaryButtonText: {
    color: WEB.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },

  webLogoutButton: {
    marginTop: 0,
    backgroundColor: '#FFF4F5',
    borderWidth: 1,
    borderColor: '#F3D9DF',
    borderRadius: 10,
    paddingVertical: 14,
  },

  webLogoutText: {
    color: WEB.danger,
    fontSize: 15,
    fontWeight: '700',
  },

  webInput: {
    borderColor: WEB.border,
    borderRadius: 10,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
});
