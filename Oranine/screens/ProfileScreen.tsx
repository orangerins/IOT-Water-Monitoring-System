import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/theme';
import { DEFAULT_PROFILE } from '../data/sampleData';
import {
  NavigationProps,
  UserProfile,
} from '../types';

import Header from '../src/components/Header';
import BottomNavigation from '../src/components/BottomNavigation';

export default function ProfileScreen({
  navigate,
}: NavigationProps) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] =
    useState<UserProfile>(DEFAULT_PROFILE);

  const updateField = (
    field: keyof UserProfile,
    value: string
  ) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  };

  const saveProfile = () => {
    setEditing(false);

    Alert.alert(
      'Profile updated',
      'Your information has been saved.'
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        subtitle="Your personal information"
      />

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              User Profile
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (editing) {
                  saveProfile();
                } else {
                  setEditing(true);
                }
              }}
            >
              <Ionicons
                name={
                  editing
                    ? 'checkmark-circle'
                    : 'pencil'
                }
                size={23}
                color={COLORS.black}
              />
            </TouchableOpacity>
          </View>

          {(Object.keys(profile) as (keyof UserProfile)[]).map(
            (field) => (
              <View key={field} style={styles.field}>
                <Text style={styles.label}>
                  {field.charAt(0).toUpperCase() +
                    field.slice(1)}
                  :
                </Text>

                {editing ? (
                  <TextInput
                    value={profile[field]}
                    onChangeText={(value) =>
                      updateField(field, value)
                    }
                    style={styles.input}
                  />
                ) : (
                  <Text style={styles.value}>
                    {profile[field]}
                  </Text>
                )}
              </View>
            )
          )}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => navigate('login')}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={COLORS.white}
            />

            <Text style={styles.logoutText}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <BottomNavigation
        active="profile"
        navigate={navigate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  content: {
    flex: 1,
    padding: 12,
    margin: 12,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },

  profileCard: {
    flex: 1,
    padding: 17,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },

  cardHeader: {
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },

  field: {
    marginBottom: 13,
  },

  label: {
    marginBottom: 4,
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
  },

  value: {
    color: COLORS.muted,
    fontSize: 13,
  },

  input: {
    height: 37,
    paddingHorizontal: 10,
    borderRadius: 7,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },

  logoutButton: {
    marginTop: 'auto',
    paddingVertical: 10,
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
});