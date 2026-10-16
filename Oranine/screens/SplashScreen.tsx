
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { NavigationProps } from '../types';

const THEME = {
  lavender: '#CDA0F2',
  darkPurple: '#67318A',
  softLavender: '#F4EAFB',
  background: '#F8F7FA',
  white: '#FFFFFF',
  text: '#30243A',
  muted: '#63586D',
};

export default function SplashScreen({
  navigate,
}: NavigationProps) {
  const { width } = useWindowDimensions();

  const isDesktop =
    Platform.OS === 'web' && width >= 900;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <View style={styles.container}>
      <View style={styles.decorativeCircleTop} />
      <View style={styles.decorativeCircleBottom} />

      <View
        style={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
      >
        <View style={styles.logoOuter}>
          <View style={styles.logoInner}>
            <Ionicons
              name="fish"
              size={isDesktop ? 68 : 58}
              color={THEME.darkPurple}
            />
          </View>
        </View>

        <Text
          style={[
            styles.appName,
            isDesktop && styles.desktopAppName,
          ]}
        >
          Oranine
        </Text>

        <Text style={styles.subtitle}>
          Smart Tilapia Water Monitoring
        </Text>

        <View style={styles.divider} />

        <Text style={styles.description}>
          Helping fish farmers monitor pond water
          quality with ease.
        </Text>

        <View style={styles.loadingSection}>
          <ActivityIndicator
            size="small"
            color={THEME.darkPurple}
          />

          <Text style={styles.loadingText}>
            Preparing your monitoring system...
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Oranine Water Quality Monitoring System
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.softLavender,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 24,
  },

  decorativeCircleTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E7D0F8',
    top: -135,
    right: -105,
  },

  decorativeCircleBottom: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#E7D0F8',
    bottom: -125,
    left: -110,
  },

  content: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    paddingVertical: 30,
    zIndex: 1,
  },

  desktopContent: {
    maxWidth: 520,
  },

  logoOuter: {
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: THEME.white,
    borderWidth: 4,
    borderColor: THEME.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  logoInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: THEME.softLavender,
    alignItems: 'center',
    justifyContent: 'center',
  },

  appName: {
    color: THEME.darkPurple,
    fontSize: 37,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  desktopAppName: {
    fontSize: 45,
  },

  subtitle: {
    color: THEME.darkPurple,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },

  divider: {
    width: 65,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.lavender,
    marginVertical: 23,
  },

  description: {
    color: THEME.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 350,
  },

  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 37,
  },

  loadingText: {
    color: THEME.darkPurple,
    fontSize: 13,
    fontWeight: '600',
  },

  footer: {
    position: 'absolute',
    bottom: 28,
    color: THEME.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
