import React, {
  useCallback,
  useState,
} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';

import { COLORS } from './constants/theme';
import { ScreenName } from './types';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import DashboardScreen from './screens/DashboardScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] =
    useState<ScreenName>('splash');

  const navigate = useCallback(
    (nextScreen: ScreenName) => {
      setCurrentScreen(nextScreen);
    },
    []
  );

  const screens: Record<
    ScreenName,
    React.ReactElement
  > = {
    splash: (
      <SplashScreen navigate={navigate} />
    ),

    login: (
      <LoginScreen navigate={navigate} />
    ),

    signup: (
      <SignUpScreen navigate={navigate} />
    ),

    dashboard: (
      <DashboardScreen navigate={navigate} />
    ),

    analytics: (
      <AnalyticsScreen navigate={navigate} />
    ),

    history: (
      <HistoryScreen navigate={navigate} />
    ),

    profile: (
      <ProfileScreen navigate={navigate} />
    ),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {screens[currentScreen]}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
});