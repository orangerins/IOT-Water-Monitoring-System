import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORS } from '../constants/theme';
import {
  WATER_READINGS,
  readingIsSafe,
} from '../data/sampleData';
import { NavigationProps } from '../types';

import Header from '../src/components/Header';
import BottomNavigation from '../src/components/BottomNavigation';
import ParameterCard from '../src/components/ParameterCard';

export default function AnalyticsScreen({
  navigate,
}: NavigationProps) {
  const allSafe = WATER_READINGS.every(readingIsSafe);

  return (
    <View style={styles.container}>
      <Header
        title="Analytics"
        subtitle="Water Quality Overview"
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.panel}>
          <View style={styles.overallCard}>
            <Text style={styles.overallTitle}>
              Overall Status
            </Text>

            <Text
              style={[
                styles.overallValue,
                {
                  color: allSafe
                    ? COLORS.success
                    : COLORS.danger,
                },
              ]}
            >
              {allSafe
                ? 'All parameters are safe'
                : 'Check unsafe readings'}
            </Text>
          </View>

          <View style={styles.grid}>
            {WATER_READINGS.map((reading) => (
              <ParameterCard
                key={reading.id}
                reading={reading}
                compact
              />
            ))}
          </View>

          <View style={styles.informationCard}>
            <Text style={styles.informationTitle}>
              Latest analysis
            </Text>

            <Text style={styles.informationText}>
              All sensors are online. The readings will
              update automatically when the application is
              connected to the monitoring device.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation
        active="analytics"
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
    flexGrow: 1,
    padding: 12,
  },

  panel: {
    minHeight: '100%',
    padding: 15,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },

  overallCard: {
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: COLORS.card,
  },

  overallTitle: {
    marginBottom: 5,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },

  overallValue: {
    fontSize: 12,
    fontWeight: '800',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  informationCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
  },

  informationTitle: {
    color: COLORS.primary,
    fontWeight: '900',
  },

  informationText: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },
});