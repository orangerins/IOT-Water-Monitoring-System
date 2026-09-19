import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/theme';

type HeaderProps = {
  title: string;
  subtitle: string;
  showAvatar?: boolean;
};

export default function Header({
  title,
  subtitle,
  showAvatar = true,
}: HeaderProps) {
  const [notificationVisible, setNotificationVisible] =
    useState(false);

  const [aboutVisible, setAboutVisible] =
    useState(false);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showAvatar ? (
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={25}
                color={COLORS.primary}
              />
            </View>
          ) : null}

          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {title}
            </Text>

            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.icons}>
          {/* Notification button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              setNotificationVisible(true)
            }
          >
            <Ionicons
              name="notifications"
              size={22}
              color="#FACC15"
            />

            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>

          {/* About button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setAboutVisible(true)}
          >
            <Ionicons
              name="information-circle"
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification modal */}
      <Modal
        visible={notificationVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setNotificationVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setNotificationVisible(false)
          }
        >
          <Pressable
            style={styles.modalContainer}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons
                  name="notifications"
                  size={23}
                  color={COLORS.primary}
                />

                <Text style={styles.modalTitle}>
                  Notifications
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setNotificationVisible(false)
                }
              >
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.notificationList}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.warningNotification}>
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name="warning"
                    size={21}
                    color={COLORS.danger}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    High Turbidity Detected
                  </Text>

                  <Text style={styles.notificationMessage}>
                    Turbidity reached 27.4 NTU and
                    exceeded the safe limit of 25 NTU.
                  </Text>

                  <Text style={styles.notificationTime}>
                    August 18, 2026 • 4:20 PM
                  </Text>
                </View>
              </View>

              <View style={styles.warningNotification}>
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name="warning"
                    size={21}
                    color={COLORS.danger}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    Low Dissolved Oxygen
                  </Text>

                  <Text style={styles.notificationMessage}>
                    Dissolved oxygen dropped below the
                    safe level of 5 mg/L.
                  </Text>

                  <Text style={styles.notificationTime}>
                    August 15, 2026 • 6:12 AM
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setNotificationVisible(false)
              }
            >
              <Text style={styles.closeButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* About modal */}
      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setAboutVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAboutVisible(false)}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons
                  name="information-circle"
                  size={25}
                  color={COLORS.primary}
                />

                <Text style={styles.modalTitle}>
                  About Oranine
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setAboutVisible(false)
                }
              >
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutLogo}>
              <Ionicons
                name="fish"
                size={55}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.applicationName}>
              Oranine
            </Text>

            <Text style={styles.applicationSubtitle}>
              Smart Tilapia Water Monitoring
            </Text>

            <Text style={styles.aboutText}>
              Oranine is an IoT-based water quality
              monitoring application designed for
              Oreochromis niloticus or tilapia
              aquaculture.
            </Text>

            <Text style={styles.aboutText}>
              The application helps fish farmers monitor
              the dissolved oxygen, pH level,
              temperature, and turbidity of their pond
              water.
            </Text>

            <Text style={styles.aboutText}>
              It displays sensor readings, provides water
              quality analytics, stores previous records,
              and warns the user when a reading exceeds
              the safe range for tilapia.
            </Text>

            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>
                Application Version 1.0.0
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setAboutVisible(false)}
            >
              <Text style={styles.closeButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 98,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 15,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 51,
    height: 51,
    marginRight: 12,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleContainer: {
    flex: 1,
  },

  title: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 3,
    color: '#E9D5FF',
    fontSize: 10,
  },

  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900',
  },

  modalOverlay: {
    flex: 1,
    padding: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.white,
  },

  modalHeader: {
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
  },

  notificationList: {
    maxHeight: 330,
  },

  warningNotification: {
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 13,
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
  },

  notificationIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },

  notificationMessage: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  notificationTime: {
    marginTop: 7,
    color: '#9CA3AF',
    fontSize: 9,
  },

  aboutLogo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    borderRadius: 50,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  applicationName: {
    marginTop: 10,
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },

  applicationSubtitle: {
    marginBottom: 17,
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
  },

  aboutText: {
    marginBottom: 10,
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'justify',
  },

  versionContainer: {
    padding: 9,
    marginTop: 5,
    borderRadius: 9,
    backgroundColor: '#EDE9FE',
  },

  versionText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  closeButton: {
    paddingVertical: 11,
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },

  closeButtonText: {
    color: COLORS.white,
    fontWeight: '900',
  },
});