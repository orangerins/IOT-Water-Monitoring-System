import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/theme';
import {
  MainScreen,
  ScreenName,
} from '../../types';

type NavigationItem = {
  screen: MainScreen;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type BottomNavigationProps = {
  active: MainScreen;
  navigate: (screen: ScreenName) => void;
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