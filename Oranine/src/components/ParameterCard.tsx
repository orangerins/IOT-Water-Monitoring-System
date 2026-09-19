import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants/theme';
import { readingIsSafe } from '../../data/sampleData';
import { WaterReading } from '../../types';

type ParameterCardProps = {
  reading: WaterReading;
  compact?: boolean;
};

export default function ParameterCard({
  reading,
  compact = false,
}: ParameterCardProps) {
  const safe = readingIsSafe(reading);

  return (
    <View
      style={[
        styles.card,
        compact && styles.compactCard,
        {
          borderColor: safe
            ? '#86EFAC'
            : '#FCA5A5',
        },
      ]}
    >
      <View style={styles.nameRow}>
        <View style={styles.sensorIcon}>
          <Ionicons
            name={
              reading.icon as keyof typeof Ionicons.glyphMap
            }
            size={compact ? 15 : 19}
            color={COLORS.primary}
          />
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.name,
            compact && styles.compactName,
          ]}
        >
          {reading.name}
        </Text>
      </View>

      <Text
        style={[
          styles.reading,
          compact && styles.compactReading,
        ]}
      >
        {reading.value} {reading.unit}
      </Text>

      <View style={styles.safeLevelContainer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={13}
          color={COLORS.primary}
        />

        <View style={styles.safeLevelTextContainer}>
          <Text style={styles.safeLevelLabel}>
            Safe level
          </Text>

          <Text
            style={[
              styles.safeLevel,
              compact && styles.compactSafeLevel,
            ]}
          >
            {reading.safeLevel}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statusContainer,
          {
            backgroundColor: safe
              ? '#DCFCE7'
              : '#FEE2E2',
          },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: safe
                ? COLORS.success
                : COLORS.danger,
            },
          ]}
        />

        <Text
          style={[
            styles.status,
            {
              color: safe
                ? COLORS.success
                : COLORS.danger,
            },
          ]}
        >
          {safe ? 'Safe' : 'Warning'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 150,
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: COLORS.card,
  },

  compactCard: {
    width: '48%',
    minHeight: 170,
    marginBottom: 12,
    padding: 11,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sensorIcon: {
    width: 29,
    height: 29,
    marginRight: 7,
    borderRadius: 15,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },

  compactName: {
    fontSize: 10,
  },

  reading: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900',
  },

  compactReading: {
    fontSize: 16,
  },

  safeLevelContainer: {
    padding: 8,
    marginTop: 10,
    borderRadius: 9,
    backgroundColor: '#EDE9FE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  safeLevelTextContainer: {
    flex: 1,
    marginLeft: 6,
  },

  safeLevelLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '700',
  },

  safeLevel: {
    marginTop: 1,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
  },

  compactSafeLevel: {
    fontSize: 9,
  },

  statusContainer: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 9,
    alignSelf: 'flex-start',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 7,
    height: 7,
    marginRight: 5,
    borderRadius: 4,
  },

  status: {
    fontSize: 9,
    fontWeight: '900',
  },
});