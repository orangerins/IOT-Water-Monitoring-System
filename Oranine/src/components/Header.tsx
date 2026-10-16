
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/theme';

type HeaderProps = {
  title: string;
  subtitle: string;
  showAvatar?: boolean;
};

const THEME = {
  lavender: '#CDA0F2',
  dark: '#67318A',
  soft: '#F4EAFB',
  background: '#FFFFFF',
  border: '#E8E1EC',
  text: '#30243A',
  muted: '#63586D',
};

export default function Header({
  title,
  subtitle,
  showAvatar = true,
}: HeaderProps) {
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === 'web' && width >= 900;

  const [notificationVisible, setNotificationVisible] =
    useState(false);

  const [aboutVisible, setAboutVisible] =
    useState(false);

  return (
    <>
      <View
        style={[
          styles.header,
          isDesktop && styles.webHeader,
        ]}
      >
        <View style={styles.leftSection}>
          {showAvatar && (
            <View
              style={[
                styles.avatar,
                isDesktop && styles.webAvatar,
              ]}
            >
              <Ionicons
                name="person"
                size={isDesktop ? 21 : 25}
                color={THEME.dark}
              />
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                isDesktop && styles.webTitle,
              ]}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.subtitle,
                isDesktop && styles.webSubtitle,
              ]}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.icons}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              isDesktop && styles.webIconButton,
            ]}
            onPress={() => setNotificationVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={THEME.dark}
            />

            {isDesktop && (
              <Text style={styles.webActionLabel}>
                Notifications
              </Text>
            )}

            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>
                2
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              isDesktop && styles.webIconButton,
            ]}
            onPress={() => setAboutVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="About Oranine"
          >
            <Ionicons
              name="information-circle-outline"
              size={23}
              color={THEME.dark}
            />

            {isDesktop && (
              <Text style={styles.webActionLabel}>
                About
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* NOTIFICATIONS MODAL */}

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
                  name="notifications-outline"
                  size={24}
                  color={THEME.dark}
                />

                <Text style={styles.modalTitle}>
                  Notifications
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setNotificationVisible(false)
                }
                accessibilityLabel="Close notifications"
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={THEME.muted}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.sampleNotice}>
              Example notifications — not live sensor alerts
            </Text>

            <ScrollView
              style={styles.notificationList}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.warningNotification}>
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name="warning-outline"
                    size={23}
                    color={COLORS.danger}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    High Turbidity Detected
                  </Text>

                  <Text style={styles.notificationMessage}>
                    Example: Turbidity reached 27.4 NTU
                    and exceeded a configured safe limit.
                  </Text>

                  <Text style={styles.notificationTime}>
                    Sample notification
                  </Text>
                </View>
              </View>

              <View style={styles.warningNotification}>
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name="warning-outline"
                    size={23}
                    color={COLORS.danger}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    Low Dissolved Oxygen
                  </Text>

                  <Text style={styles.notificationMessage}>
                    Example: Dissolved oxygen dropped
                    below the configured safe level.
                  </Text>

                  <Text style={styles.notificationTime}>
                    Sample notification
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

      {/* ABOUT MODAL */}

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
                  name="information-circle-outline"
                  size={25}
                  color={THEME.dark}
                />

                <Text style={styles.modalTitle}>
                  About Oranine
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setAboutVisible(false)
                }
                accessibilityLabel="Close about information"
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={THEME.muted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutLogo}>
              <Ionicons
                name="fish"
                size={50}
                color={THEME.dark}
              />
            </View>

            <Text style={styles.applicationName}>
              Oranine
            </Text>

            <Text style={styles.applicationSubtitle}>
              Smart Tilapia Water Monitoring
            </Text>

            <ScrollView
              style={styles.aboutScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.aboutText}>
                Oranine is an IoT-based water quality
                monitoring application designed for
                Oreochromis niloticus or Nile tilapia
                aquaculture.
              </Text>

              <Text style={styles.aboutText}>
                The application helps fish farmers monitor
                dissolved oxygen, pH level, temperature,
                and turbidity in their pond water.
              </Text>

              <Text style={styles.aboutText}>
                It displays sensor readings, provides
                water quality analytics, stores previous
                records, and warns users when a reading
                exceeds the configured safe range.
              </Text>
            </ScrollView>

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
    minHeight: 88,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: THEME.lavender,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },

  webHeader: {
    minHeight: 72,
    paddingHorizontal: 32,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: THEME.background,
  },

  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  avatar: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  titleContainer: {
    flex: 1,
  },

  title: {
    color: THEME.dark,
    fontSize: 19,
    fontWeight: '800',
  },

  webTitle: {
    fontSize: 20,
    color: THEME.text,
  },

  subtitle: {
    marginTop: 3,
    color: THEME.dark,
    fontSize: 12,
  },

  webSubtitle: {
    fontSize: 13,
    color: THEME.muted,
  },

  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  iconButton: {
    minWidth: 42,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webIconButton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: THEME.soft,
  },

  webActionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.dark,
  },

  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },

  modalOverlay: {
    flex: 1,
    padding: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalContainer: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '85%',
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },

  modalHeader: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },

  sampleNotice: {
    color: THEME.muted,
    fontSize: 12,
    marginBottom: 14,
  },

  notificationList: {
    maxHeight: 300,
  },

  warningNotification: {
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
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
    fontSize: 15,
    fontWeight: '800',
  },

  notificationMessage: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },

  notificationTime: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 11,
  },

  aboutLogo: {
    width: 92,
    height: 92,
    alignSelf: 'center',
    borderRadius: 46,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applicationName: {
    marginTop: 10,
    color: THEME.dark,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },

  applicationSubtitle: {
    marginBottom: 16,
    color: THEME.muted,
    fontSize: 13,
    textAlign: 'center',
  },

  aboutScroll: {
    maxHeight: 220,
  },

  aboutText: {
    marginBottom: 11,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'left',
  },

  versionContainer: {
    padding: 10,
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: THEME.soft,
  },

  versionText: {
    color: THEME.dark,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  closeButton: {
    paddingVertical: 13,
    marginTop: 16,
    borderRadius: 11,
    backgroundColor: THEME.dark,
    alignItems: 'center',
  },

  closeButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
