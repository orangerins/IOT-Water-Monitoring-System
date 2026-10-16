
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/theme';
import { NavigationProps } from '../types';
import Header from '../src/components/Header';
import BottomNavigation from '../src/components/BottomNavigation';
import { API, getApi } from '../src/api';

// =====================================================
// TYPES
// =====================================================

type Sensor = {
  sensor_id: number;
  type: string;
  unit: string;
  min_threshold: string | number | null;
  max_threshold: string | number | null;
  device: number;
};

type Reading = {
  reading_id: number;
  sensor: number;
  value: string | number | null;
  raw_adc: number | null;
  raw_voltage: string | number | null;
  status: string;
  recorded_at: string;
};

type ApiList<T> =
  | T[]
  | {
      results: T[];
      next?: string | null;
    };

type TimeRange = '1H' | '24H' | '7D' | '30D';

type ChartPoint = {
  id: number;
  value: number;
  date: string;
};

type SensorAnalysis = {
  sensor: Sensor;
  name: string;
  measurementLabel: string;
  calibrated: boolean;
  latestValue: number | null;
  latestTime: string | null;
  latestStatus: string;
  points: ChartPoint[];
  min: number | null;
  max: number | null;
  average: number | null;
  color: string;
};

type IconName = keyof typeof Ionicons.glyphMap;

// =====================================================
// THEME AND CONSTANTS
// =====================================================

const THEME = {
  lavender: '#CDA0F2',
  dark: '#67318A',
  soft: '#F4EAFB',
  background: '#F8F7FA',
  white: '#FFFFFF',
  text: '#30243A',
  muted: '#63586D',
  border: '#E8E1EC',
  warning: '#A65B00',
};

const REFRESH_INTERVAL = 10000;
const OFFLINE_AFTER_MS = 60000;

const TIME_RANGES: {
  label: string;
  value: TimeRange;
  milliseconds: number;
}[] = [
  {
    label: '1 Hour',
    value: '1H',
    milliseconds: 60 * 60 * 1000,
  },
  {
    label: '24 Hours',
    value: '24H',
    milliseconds: 24 * 60 * 60 * 1000,
  },
  {
    label: '7 Days',
    value: '7D',
    milliseconds: 7 * 24 * 60 * 60 * 1000,
  },
  {
    label: '30 Days',
    value: '30D',
    milliseconds: 30 * 24 * 60 * 60 * 1000,
  },
];

// =====================================================
// HELPERS
// =====================================================

function asArray<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}

function numericValue(
  value: string | number | null | undefined
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function sensorName(type: string): string {
  switch (type.toLowerCase()) {
    case 'temperature':
      return 'Water Temperature';
    case 'ph':
      return 'pH Level';
    case 'do':
      return 'Dissolved Oxygen';
    case 'turbidity':
      return 'Turbidity';
    default:
      return type;
  }
}

function sensorIcon(type: string): IconName {
  switch (type.toLowerCase()) {
    case 'temperature':
      return 'thermometer-outline';
    case 'ph':
      return 'flask-outline';
    case 'do':
      return 'water-outline';
    case 'turbidity':
      return 'eye-outline';
    default:
      return 'analytics-outline';
  }
}

function sensorColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'temperature':
      return '#67318A';
    case 'ph':
      return '#9B5FC0';
    case 'do':
      return '#387D9C';
    case 'turbidity':
      return '#B77835';
    default:
      return THEME.dark;
  }
}

function formatNumber(
  value: number | null,
  decimals = 2
): string {
  return value === null ? '--' : value.toFixed(decimals);
}

function formatDate(value: string | null): string {
  if (!value) return 'No readings';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function getRangeMilliseconds(
  range: TimeRange
): number {
  return (
    TIME_RANGES.find(
      (item) => item.value === range
    )?.milliseconds ?? TIME_RANGES[1].milliseconds
  );
}

function isRecent(date: string | null): boolean {
  if (!date) return false;

  const timestamp = new Date(date).getTime();
  const age = Date.now() - timestamp;

  return (
    Number.isFinite(timestamp) &&
    age >= -OFFLINE_AFTER_MS &&
    age <= OFFLINE_AFTER_MS
  );
}

function analyzeSensor(
  sensor: Sensor,
  readings: Reading[],
  range: TimeRange
): SensorAnalysis {
  const matching = readings
    .filter(
      (reading) =>
        reading.sensor === sensor.sensor_id
    )
    .sort((a, b) => {
      const timeDifference =
        new Date(a.recorded_at).getTime() -
        new Date(b.recorded_at).getTime();

      return (
        timeDifference ||
        a.reading_id - b.reading_id
      );
    });

  const latest = matching[matching.length - 1];

  // Only temperature is currently calibrated.
  const calibrated =
    sensor.type.toLowerCase() === 'temperature';

  const measurementLabel = calibrated
    ? sensor.unit
    : 'Raw voltage (V)';

  const now = Date.now();
  const cutoff = now - getRangeMilliseconds(range);

  const points: ChartPoint[] = matching
    .filter((reading) => {
      const timestamp = new Date(
        reading.recorded_at
      ).getTime();

      return (
        Number.isFinite(timestamp) &&
        timestamp >= cutoff &&
        timestamp <= now + OFFLINE_AFTER_MS
      );
    })
    .map((reading) => {
      const value = calibrated
        ? numericValue(reading.value)
        : numericValue(reading.raw_voltage);

      if (value === null) return null;

      return {
        id: reading.reading_id,
        value,
        date: reading.recorded_at,
      };
    })
    .filter(
      (point): point is ChartPoint =>
        point !== null
    );

  const values = points.map((point) => point.value);

  let min: number | null = null;
  let max: number | null = null;
  let total = 0;

  values.forEach((value) => {
    min = min === null ? value : Math.min(min, value);
    max = max === null ? value : Math.max(max, value);
    total += value;
  });

  const average =
    values.length > 0 ? total / values.length : null;

  const latestValue = latest
    ? calibrated
      ? numericValue(latest.value)
      : numericValue(latest.raw_voltage)
    : null;

  return {
    sensor,
    name: sensorName(sensor.type),
    measurementLabel,
    calibrated,
    latestValue,
    latestTime: latest?.recorded_at ?? null,
    latestStatus: latest?.status ?? 'no_data',
    points,
    min,
    max,
    average,
    color: sensorColor(sensor.type),
  };
}

// =====================================================
// BAR CHART
// =====================================================

function TrendChart({
  points,
  color,
}: {
  points: ChartPoint[];
  color: string;
}) {
  if (points.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Ionicons
          name="bar-chart-outline"
          size={30}
          color={THEME.muted}
        />

        <Text style={styles.emptyChartText}>
          No readings in this time range.
        </Text>
      </View>
    );
  }

  // Limit displayed bars to keep the chart readable.
  const displayed =
    points.length > 60
      ? points.filter(
          (_, index) =>
            index %
              Math.ceil(points.length / 60) ===
              0 ||
            index === points.length - 1
        )
      : points;

  let min = displayed[0].value;
  let max = displayed[0].value;

  displayed.forEach((point) => {
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
  });

  const spread = max - min || 1;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartLabel}>
        Highest: {max.toFixed(2)}
      </Text>

      <View style={styles.chartBars}>
        {displayed.map((point) => {
          const height =
            15 +
            ((point.value - min) / spread) * 85;

          return (
            <View
              key={point.id}
              style={styles.chartBarSlot}
            >
              <View
                style={[
                  styles.chartBar,
                  {
                    height: `${height}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <Text style={styles.chartLabel}>
        Lowest: {min.toFixed(2)}
      </Text>

      <View style={styles.chartAxis}>
        <Text style={styles.chartAxisText}>
          {formatDate(displayed[0]?.date ?? null)}
        </Text>

        <Text
          style={[
            styles.chartAxisText,
            styles.chartAxisRight,
          ]}
        >
          {formatDate(
            displayed[displayed.length - 1]?.date ??
              null
          )}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// MAIN SCREEN
// =====================================================

export default function AnalyticsScreen({
  navigate,
}: NavigationProps) {
  const { width } = useWindowDimensions();

  const isDesktop =
    Platform.OS === 'web' && width >= 900;

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);

  const [range, setRange] =
    useState<TimeRange>('24H');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [lastChecked, setLastChecked] =
    useState<string | null>(null);

  const requestInProgress = useRef(false);
  const mounted = useRef(true);

  // Existing Django API fetching is preserved.
  const loadAnalytics = useCallback(async () => {
    if (requestInProgress.current) return;

    requestInProgress.current = true;

    try {
      const [sensorData, readingData] =
        await Promise.all([
          getApi<ApiList<Sensor>>(API.sensors),
          getApi<ApiList<Reading>>(API.readings),
        ]);

      if (!mounted.current) return;

      setSensors(asArray(sensorData));
      setReadings(asArray(readingData));
      setLastChecked(new Date().toISOString());
      setError('');
    } catch (err) {
      if (!mounted.current) return;

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load analytics data.'
      );
    } finally {
      requestInProgress.current = false;

      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadAnalytics();

    const interval = setInterval(
      loadAnalytics,
      REFRESH_INTERVAL
    );

    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [loadAnalytics]);

  const onRefresh = () => {
    if (requestInProgress.current) return;

    setRefreshing(true);
    loadAnalytics();
  };

  const analyses = useMemo(
    () =>
      sensors.map((sensor) =>
        analyzeSensor(sensor, readings, range)
      ),
    [sensors, readings, range, lastChecked]
  );

  // Do not treat uncalibrated sensor values as
  // confirmed safe or unsafe.
  const hasUnsafe = analyses.some(
    (analysis) =>
      analysis.calibrated &&
      isRecent(analysis.latestTime) &&
      analysis.latestStatus.toLowerCase() ===
        'unsafe'
  );

  const allSafe =
    analyses.length > 0 &&
    analyses.every(
      (analysis) =>
        analysis.calibrated &&
        isRecent(analysis.latestTime) &&
        analysis.latestStatus.toLowerCase() ===
          'safe'
    );

  const allOffline =
    analyses.length > 0 &&
    analyses.every(
      (analysis) => !isRecent(analysis.latestTime)
    );

  const overallStatus = allOffline
    ? 'OFFLINE'
    : hasUnsafe
      ? 'WARNING'
      : allSafe
        ? 'SAFE'
        : 'INCOMPLETE DATA';

  const overallColor =
    overallStatus === 'SAFE'
      ? COLORS.success
      : overallStatus === 'WARNING'
        ? COLORS.danger
        : overallStatus === 'OFFLINE'
          ? '#475569'
          : '#92400E';

  const overallBackground =
    overallStatus === 'SAFE'
      ? '#E7F7EC'
      : overallStatus === 'WARNING'
        ? '#FFF0F0'
        : overallStatus === 'OFFLINE'
          ? '#EDF0F4'
          : '#FFF5DF';

  const renderSensor = (analysis: SensorAnalysis) => {
    const online = isRecent(analysis.latestTime);

    return (
      <View
        key={analysis.sensor.sensor_id}
        style={[
          styles.sensorCard,
          isDesktop && styles.webSensorCard,
        ]}
      >
        <View style={styles.sensorHeader}>
          <View style={styles.sensorHeadingLeft}>
            <View style={styles.sensorIconBox}>
              <Ionicons
                name={sensorIcon(analysis.sensor.type)}
                size={23}
                color={THEME.dark}
              />
            </View>

            <Text style={styles.sensorName}>
              {analysis.name}
            </Text>
          </View>
        </View>

        <View style={styles.sensorStatusRow}>
          <Text
            style={[
              styles.sensorStatus,
              {
                color: analysis.calibrated
                  ? COLORS.success
                  : THEME.warning,
              },
            ]}
          >
            {analysis.calibrated
              ? 'CALIBRATED'
              : 'UNCALIBRATED'}
          </Text>

          <View style={styles.connectionRow}>
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: online
                    ? COLORS.success
                    : '#94A3B8',
                },
              ]}
            />

            <Text style={styles.connectionText}>
              {online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <Text style={styles.measurementLabel}>
          {analysis.measurementLabel}
        </Text>

        <View style={styles.valueRow}>
          <Text style={styles.latestValue}>
            {formatNumber(analysis.latestValue)}
          </Text>

          <Text style={styles.latestUnit}>
            {analysis.calibrated
              ? analysis.measurementLabel
              : 'V'}
          </Text>
        </View>

        {!online && (
          <Text style={styles.offlineNote}>
            Last stored reading — sensor is not
            currently reporting.
          </Text>
        )}

        <Text style={styles.latestTime}>
          Last reading: {formatDate(analysis.latestTime)}
        </Text>

        <View style={styles.chartSection}>
          <Text style={styles.chartHeading}>
            Reading Trend
          </Text>

          <TrendChart
            points={analysis.points}
            color={analysis.color}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>
              Minimum
            </Text>

            <Text style={styles.statValue}>
              {formatNumber(analysis.min)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>
              Average
            </Text>

            <Text style={styles.statValue}>
              {formatNumber(analysis.average)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>
              Maximum
            </Text>

            <Text style={styles.statValue}>
              {formatNumber(analysis.max)}
            </Text>
          </View>
        </View>

        <Text style={styles.sampleCount}>
          {analysis.points.length} readings in the
          selected time range
        </Text>

        {!analysis.calibrated && (
          <View style={styles.calibrationBox}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={THEME.warning}
            />

            <Text style={styles.calibrationNote}>
              These results show raw voltage, not
              calibrated water-quality measurements.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Analytics"
        subtitle="Water Quality Overview"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.webContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.dark}
          />
        }
      >
        <View style={styles.panel}>
          <View style={styles.pageHeading}>
            <View style={styles.headingText}>
              <Text style={styles.heading}>
                Water Quality Analytics
              </Text>

              <Text style={styles.subtitle}>
                Sensor trends and water quality records
              </Text>
            </View>

            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                Auto-refresh: 10s
              </Text>
            </View>
          </View>

          {lastChecked && (
            <Text style={styles.lastChecked}>
              Last checked: {formatDate(lastChecked)}
            </Text>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={THEME.dark}
              />

              <Text style={styles.loadingText}>
                Loading analytics...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Connection Error
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.overallCard,
                  {
                    backgroundColor:
                      overallBackground,
                  },
                ]}
              >
                <View style={styles.overallHeading}>
                  <Ionicons
                    name={
                      overallStatus === 'SAFE'
                        ? 'checkmark-circle-outline'
                        : overallStatus === 'WARNING'
                          ? 'warning-outline'
                          : 'information-circle-outline'
                    }
                    size={24}
                    color={overallColor}
                  />

                  <Text style={styles.overallTitle}>
                    Overall Water Quality
                  </Text>
                </View>

                <Text
                  style={[
                    styles.overallValue,
                    { color: overallColor },
                  ]}
                >
                  {overallStatus}
                </Text>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterHeading}>
                  Select Time Range
                </Text>

                <View style={styles.filterRow}>
                  {TIME_RANGES.map((item) => {
                    const selected =
                      range === item.value;

                    return (
                      <Pressable
                        key={item.value}
                        onPress={() =>
                          setRange(item.value)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={
                          `Show last ${item.label}`
                        }
                        accessibilityState={{
                          selected,
                        }}
                        style={[
                          styles.filterButton,
                          selected &&
                            styles.filterButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterText,
                            selected &&
                              styles.filterTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View
                style={[
                  styles.sensorGrid,
                  isDesktop && styles.webSensorGrid,
                ]}
              >
                {analyses.map(renderSensor)}
              </View>

              {analyses.length === 0 && (
                <View style={styles.informationCard}>
                  <Text style={styles.informationTitle}>
                    No sensors found
                  </Text>

                  <Text style={styles.informationText}>
                    Add sensors to your device through
                    Django first.
                  </Text>
                </View>
              )}

              <View style={styles.informationCard}>
                <View style={styles.informationHeading}>
                  <Ionicons
                    name="information-circle-outline"
                    size={21}
                    color={THEME.dark}
                  />

                  <Text style={styles.informationTitle}>
                    About These Analytics
                  </Text>
                </View>

                <Text style={styles.informationText}>
                  These charts use sensor readings
                  returned by Django. Temperature is
                  displayed in degrees Celsius.
                  Dissolved oxygen, pH, and turbidity
                  are displayed as raw voltage until
                  calibration is completed.
                </Text>

                <Text style={styles.informationText}>
                  Analytics automatically refresh
                  every 10 seconds. Minimum, average,
                  and maximum values are calculated
                  from the readings in the selected
                  time range.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <BottomNavigation
        active="analytics"
        navigate={navigate}
      />
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 14,
  },

  webContent: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
  },

  panel: {
    width: '100%',
    maxWidth: 1080,
  },

  pageHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },

  headingText: {
    flexShrink: 1,
  },

  heading: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: '800',
  },

  subtitle: {
    color: THEME.muted,
    fontSize: 14,
    marginTop: 5,
  },

  liveIndicator: {
    backgroundColor: THEME.soft,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },

  liveText: {
    color: THEME.dark,
    fontSize: 13,
    fontWeight: '700',
  },

  lastChecked: {
    color: THEME.muted,
    fontSize: 12,
    marginBottom: 17,
  },

  overallCard: {
    padding: 17,
    borderRadius: 14,
    marginBottom: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  overallHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },

  overallTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '800',
  },

  overallValue: {
    fontSize: 16,
    fontWeight: '900',
  },

  filterSection: {
    marginBottom: 19,
  },

  filterHeading: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 11,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  filterButton: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButtonActive: {
    backgroundColor: THEME.dark,
    borderColor: THEME.dark,
  },

  filterText: {
    color: THEME.dark,
    fontSize: 14,
    fontWeight: '700',
  },

  filterTextActive: {
    color: THEME.white,
    fontWeight: '800',
  },

  sensorGrid: {
    width: '100%',
  },

  webSensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },

  sensorCard: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    padding: 19,
    marginBottom: 16,
  },

  webSensorCard: {
    width: '49%',
    minWidth: 0,
  },

  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sensorHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 11,
  },

  sensorIconBox: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sensorName: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },

  sensorStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },

  sensorStatus: {
    fontSize: 13,
    fontWeight: '800',
  },

  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  connectionDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  connectionText: {
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  measurementLabel: {
    color: THEME.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  valueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginTop: 7,
  },

  latestValue: {
    color: THEME.text,
    fontSize: 31,
    fontWeight: '900',
  },

  latestUnit: {
    color: THEME.muted,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 7,
  },

  offlineNote: {
    color: THEME.warning,
    fontSize: 12,
    marginTop: 7,
  },

  latestTime: {
    color: THEME.muted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 15,
  },

  chartSection: {
    backgroundColor: THEME.background,
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },

  chartHeading: {
    color: THEME.dark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },

  chartContainer: {
    width: '100%',
  },

  chartBars: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginVertical: 9,
  },

  chartBarSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },

  chartBar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 4,
  },

  chartLabel: {
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  chartAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },

  chartAxisText: {
    color: THEME.muted,
    fontSize: 11,
    flex: 1,
  },

  chartAxisRight: {
    textAlign: 'right',
  },

  emptyChart: {
    height: 160,
    backgroundColor: THEME.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 13,
  },

  emptyChartText: {
    color: THEME.muted,
    fontSize: 13,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  statItem: {
    flex: 1,
    minWidth: 0,
    backgroundColor: THEME.soft,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 5,
    alignItems: 'center',
  },

  statLabel: {
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  statValue: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },

  sampleCount: {
    color: THEME.muted,
    fontSize: 12,
    marginTop: 12,
  },

  calibrationBox: {
    backgroundColor: '#FFF7E9',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  calibrationNote: {
    color: THEME.warning,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  informationCard: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },

  informationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 9,
  },

  informationTitle: {
    color: THEME.dark,
    fontSize: 16,
    fontWeight: '800',
  },

  informationText: {
    color: THEME.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 6,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    color: THEME.muted,
    fontSize: 14,
    marginTop: 12,
  },

  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 18,
  },

  errorTitle: {
    color: COLORS.danger,
    fontSize: 17,
    fontWeight: '800',
  },

  errorText: {
    color: '#991B1B',
    fontSize: 14,
    marginTop: 8,
  },
});
