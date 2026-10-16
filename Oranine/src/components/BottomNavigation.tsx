
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/theme';
import { MainScreen, ScreenName } from '../../types';

type NavigationItem = {
  screen: MainScreen;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type BottomNavigationProps = {
  active: MainScreen;
  navigate: (screen: ScreenName) => void;
};

// WEB-ONLY COLOR PALETTE
const WEB = {
  primary: '#CDA0F2',
  primaryDark: '#67318A',
  primarySoft: '#F4EAFB',
  background: '#FFFFFF',
  text: '#30243A',
  muted: '#63586D',
  border: '#E8E1EC',
};

const navigationItems: NavigationItem[] = [
  {
    screen: 'dashboard',
    label: 'Home',
    icon: 'home',
  },
  {
    screen: 'analytics',
    label: 'Analytics',
    icon: 'bar-chart',
  },
  {
    screen: 'history',
    label: 'History',
    icon: 'time',
  },
  {
    screen: 'profile',
    label: 'Profile',
    icon: 'person-outline',
  },
];

export default function BottomNavigation({
  active,
  navigate,
}: BottomNavigationProps) {
  const { width } = useWindowDimensions();

  // Changes apply to desktop WEB only.
  const isDesktop = Platform.OS === 'web' && width >= 900;

  // =====================================================
  // WEB NAVIGATION
  // =====================================================

  if (isDesktop) {
    return (
      <View style={styles.webNavigation}>
        {/* BRAND */}
        <View style={styles.webBrand}>
          <View style={styles.webBrandIcon}>
            <Ionicons
              name="water-outline"
              size={22}
              color={WEB.primaryDark}
            />
          </View>

          <View>
            <Text style={styles.webBrandText}>
              Oranine
            </Text>

            <Text style={styles.webBrandSubtitle}>
              Water Quality Monitoring
            </Text>
          </View>
        </View>

        {/* NAVIGATION LINKS */}
        <View style={styles.webNavigationLinks}>
          {navigationItems.map((item) => {
            const selected = item.screen === active;

            return (
              <TouchableOpacity
                key={item.screen}
                style={[
                  styles.webNavigationItem,
                  selected && styles.webSelectedItem,
                ]}
                onPress={() => navigate(item.screen)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={
                    selected
                      ? WEB.primaryDark
                      : WEB.muted
                  }
                />

                <Text
                  style={[
                    styles.webNavigationLabel,
                    selected && styles.webSelectedLabel,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // =====================================================
  // MOBILE NAVIGATION — ORIGINAL CODE UNCHANGED
  // =====================================================

  return (
    <View style={styles.navigation}>
      {navigationItems.map((item) => {
        const selected = item.screen === active;

        return (
          <TouchableOpacity
            key={item.screen}
            style={styles.navigationItem}
            onPress={() => navigate(item.screen)}
          >
            <View
              style={[
                styles.iconContainer,
                selected && styles.selectedIconContainer,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={23}
                color={
                  selected
                    ? COLORS.primary
                    : COLORS.black
                }
              />
            </View>

            <Text
              style={[
                styles.label,
                selected && styles.selectedLabel,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // =====================================================
  // WEB ONLY
  // =====================================================

  webNavigation: {
    height: 74,
    backgroundColor: WEB.background,
    borderTopWidth: 1,
    borderTopColor: WEB.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
  },

  webBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  webBrandIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: WEB.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webBrandText: {
    fontSize: 19,
    fontWeight: '800',
    color: WEB.primaryDark,
  },

  webBrandSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: WEB.muted,
    marginTop: 2,
  },

  webNavigationLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  webNavigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  webSelectedItem: {
    backgroundColor: WEB.primarySoft,
    borderWidth: 1,
    borderColor: WEB.primary,
  },

  webNavigationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: WEB.muted,
  },

  webSelectedLabel: {
    color: WEB.primaryDark,
    fontWeight: '800',
  },

  // =====================================================
  // MOBILE — ORIGINAL STYLES UNCHANGED
  // =====================================================

  navigation: {
    height: 72,
    paddingTop: 5,
    borderTopWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#E5E5E5',
    flexDirection: 'row',
  },

  navigationItem: {
    flex: 1,
    alignItems: 'center',
  },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedIconContainer: {
    backgroundColor: COLORS.light,
  },

  label: {
    marginTop: 1,
    color: COLORS.black,
    fontSize: 9,
  },

  selectedLabel: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
