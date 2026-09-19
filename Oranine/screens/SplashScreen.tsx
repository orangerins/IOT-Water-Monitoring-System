import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/theme';
import { NavigationProps } from '../types';

export default function SplashScreen({
  navigate,
}: NavigationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Ionicons
          name="fish"
          size={82}
          color={COLORS.primary}
        />
      </View>

      <Text style={styles.name}>Oranine</Text>

      <Text style={styles.subtitle}>
        Smart Tilapia Water Monitoring
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },

  logo: {
    width: 142,
    height: 142,
    borderWidth: 4,
    borderRadius: 71,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  name: {
    marginTop: 18,
    color: COLORS.white,
    fontSize: 29,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 6,
    color: '#EDE9FE',
    fontSize: 12,
  },
});