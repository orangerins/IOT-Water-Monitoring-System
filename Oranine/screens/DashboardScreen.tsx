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

export default function DashboardScreen({
  navigate,
}: NavigationProps) {
  const allSafe = WATER_READINGS.every(readingIsSafe);

  return (
    <View style={styles.container}>
      <Header
        title="Welcome Oranine"
        subtitle="Monitor your water quality in real time"
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.panel}>
          <Text style={styles.heading}>
            Pond Water Readings
          </Text>

          <View
            style={[
              styles.overallCard,
              {
                backgroundColor: allSafe
                  ? '#DCFCE7'
                  : '#FEE2E2',
              },
            ]}
          >
            <Text style={styles.overallLabel}>
              Overall Status
            </Text>

            <Text
              style={[
                styles.overallStatus,
                {
                  color: allSafe
                    ? COLORS.success
                    : COLORS.danger,
                },
              ]}
            >
              {allSafe ? 'SAFE' : 'WARNING'}
            </Text>
          </View>

          {WATER_READINGS.map((reading) => (
            <View
              key={reading.id}
              style={styles.parameterContainer}
            >
              <ParameterCard reading={reading} />
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNavigation
        active="dashboard"
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
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },

  heading: {
    marginBottom: 12,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },

  overallCard: {
    padding: 13,
    marginBottom: 13,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  overallLabel: {
    color: COLORS.text,
    fontWeight: '800',
  },

  overallStatus: {
    fontWeight: '900',
  },

  parameterContainer: {
    marginBottom: 10,
  },
});