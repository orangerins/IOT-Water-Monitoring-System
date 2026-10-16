
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Platform,
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

type Sensor = {
  sensor_id: number;
  type: string;
  min_threshold: string | number | null;
  max_threshold: string | number | null;
  unit: string;
  device: number;
};

type Reading = {
  reading_id: number;
  value: string | number | null;
  raw_adc: number | null;
  raw_voltage: string | number | null;
  recorded_at: string;
  status: string;
  sensor: number;
};

type WaterAlert = {
  alert_id: number;
  message: string;
  triggered_at: string;
  resolved: boolean;
  reading: number;
};

type WaterParameter = {
  id: number;
  name: string;
  value: string;
  unit: string;
  status: string;
  rawAdc: number | null;
  rawVoltage: string | number | null;
  minThreshold: string | number | null;
  maxThreshold: string | number | null;
  recordedAt: string | null;
  isOffline: boolean;
};

type OverallStatus =
  | 'SAFE'
  | 'WARNING'
  | 'INCOMPLETE DATA'
  | 'OFFLINE';

type IconName = keyof typeof Ionicons.glyphMap;

const OFFLINE_AFTER_MS = 60 * 1000;

const THEME = {
  lavender: '#CDA0F2',
  dark: '#67318A',
  soft: '#F4EAFB',
  background: '#F8F7FA',
  white: '#FFFFFF',
  text: '#30243A',
  muted: '#63586D',
  border: '#E8E1EC',
  cardBackground: '#F8F7FA',
};

function formatSensorName(type: string): string {
  switch (type.toLowerCase()) {
    case 'do':
    case 'dissolved oxygen':
      return 'Dissolved Oxygen';
    case 'ph':
      return 'pH Level';
    case 'temperature':
      return 'Water Temperature';
    case 'turbidity':
      return 'Turbidity';
    default:
      return type;
  }
}

function getSensorIcon(name: string): IconName {
  const normalized = name.toLowerCase();

  if (normalized.includes('temperature')) {
    return 'thermometer-outline';
  }

  if (normalized.includes('oxygen')) {
    return 'water-outline';
  }

  if (normalized.includes('ph')) {
    return 'flask-outline';
  }

  if (normalized.includes('turbidity')) {
    return 'eye-outline';
  }

  return 'analytics-outline';
}

function formatReadingValue(
  value: string | number
): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? numericValue.toFixed(2)
    : '--';
}

function formatVoltage(
  value: string | number
): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? numericValue.toFixed(2)
    : '--';
}

function formatStatus(status: string): string {
  if (status === 'no_data') return 'NO DATA';
  return status.toUpperCase();
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'safe':
      return COLORS.success;
    case 'unsafe':
      return COLORS.danger;
    case 'uncalibrated':
      return '#A65B00';
    default:
      return THEME.muted;
  }
}

function formatDate(date: string): string {
  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleString();
}

export default function DashboardScreen({
  navigate,
}: NavigationProps) {
  const { width } = useWindowDimensions();

  const isDesktop =
    Platform.OS === 'web' && width >= 900;

  const [parameters, setParameters] =
    useState<WaterParameter[]>([]);

  const [alerts, setAlerts] =
    useState<WaterAlert[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  const requestInProgress = useRef(false);
  const mounted = useRef(true);

  // Existing Django API fetching is preserved.
  const loadDashboard = useCallback(async () => {
    if (requestInProgress.current) return;

    requestInProgress.current = true;

    try {
      if (mounted.current) setError('');

      const [sensors, readings, alertData] =
        await Promise.all([
          getApi<Sensor[]>(API.sensors),
          getApi<Reading[]>(API.readings),
          getApi<WaterAlert[]>(API.alerts),
        ]);

      const latestReadings: Record<number, Reading> = {};

      readings.forEach((reading) => {
        const existing = latestReadings[reading.sensor];

        if (
          !existing ||
          new Date(reading.recorded_at).getTime() >
            new Date(existing.recorded_at).getTime() ||
          (
            reading.recorded_at === existing.recorded_at &&
            reading.reading_id > existing.reading_id
          )
        ) {
          latestReadings[reading.sensor] = reading;
        }
      });

      const now = Date.now();

      const dashboardParameters: WaterParameter[] =
        sensors.map((sensor) => {
          const reading =
            latestReadings[sensor.sensor_id];

          const hasCalibratedValue =
            reading?.value !== null &&
            reading?.value !== undefined &&
            reading?.value !== '';

          const recordedTime = reading
            ? new Date(reading.recorded_at).getTime()
            : NaN;

          const isOffline =
            !reading ||
            !Number.isFinite(recordedTime) ||
            now - recordedTime > OFFLINE_AFTER_MS ||
            recordedTime > now + OFFLINE_AFTER_MS;

          const status = !reading
            ? 'no_data'
            : !hasCalibratedValue
              ? 'uncalibrated'
              : reading.status.toLowerCase();

          return {
            id: sensor.sensor_id,
            name: formatSensorName(sensor.type),
            value: hasCalibratedValue
              ? formatReadingValue(reading!.value!)
              : '--',
            unit: sensor.unit,
            status,
            rawAdc: reading?.raw_adc ?? null,
            rawVoltage: reading?.raw_voltage ?? null,
            minThreshold: sensor.min_threshold,
            maxThreshold: sensor.max_threshold,
            recordedAt: reading?.recorded_at ?? null,
            isOffline,
          };
        });

      if (!mounted.current) return;

      setParameters(dashboardParameters);
      setAlerts(alertData);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Dashboard API error:', err);

      if (mounted.current) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load water quality data.'
        );
      }
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
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 10000);

    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [loadDashboard]);

  const onRefresh = () => {
    if (requestInProgress.current) return;

    setRefreshing(true);
    loadDashboard();
  };

  const allOffline =
    parameters.length > 0 &&
    parameters.every((parameter) => parameter.isOffline);

  const hasUnsafe = parameters.some(
    (parameter) =>
      !parameter.isOffline &&
      parameter.status === 'unsafe'
  );

  const allSafe =
    parameters.length > 0 &&
    parameters.every(
      (parameter) =>
        !parameter.isOffline &&
        parameter.status === 'safe'
    );

  const overallStatus: OverallStatus = allOffline
    ? 'OFFLINE'
    : hasUnsafe
      ? 'WARNING'
      : allSafe
        ? 'SAFE'
        : 'INCOMPLETE DATA';

  const overallBackground =
    overallStatus === 'SAFE'
      ? '#E7F7EC'
      : overallStatus === 'WARNING'
        ? '#FFF0F0'
        : overallStatus === 'OFFLINE'
          ? '#EDF0F4'
          : '#FFF5DF';

  const overallTextColor =
    overallStatus === 'SAFE'
      ? COLORS.success
      : overallStatus === 'WARNING'
        ? COLORS.danger
        : overallStatus === 'OFFLINE'
          ? '#475569'
          : '#92400E';

  const activeAlerts = alerts.filter(
    (alert) => !alert.resolved
  );

  const renderParameter = (parameter: WaterParameter) => {
    const statusColor =
      getStatusColor(parameter.status);

    return (
      <View
        key={parameter.id}
        style={[
          styles.parameterCard,
          isDesktop && styles.webParameterCard,
        ]}
      >
        <View style={styles.parameterHeader}>
          <View style={styles.parameterHeadingLeft}>
            <View style={styles.sensorIcon}>
              <Ionicons
                name={getSensorIcon(parameter.name)}
                size={23}
                color={THEME.dark}
              />
            </View>

            <Text style={styles.parameterName}>
              {parameter.name}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text
            style={[
              styles.status,
              { color: statusColor },
            ]}
          >
            {formatStatus(parameter.status)}
          </Text>

          <View style={styles.connectionRow}>
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: parameter.isOffline
                    ? '#94A3B8'
                    : COLORS.success,
                },
              ]}
            />

            <Text style={styles.connectionText}>
              {parameter.isOffline
                ? 'Offline'
                : 'Online'}
            </Text>
          </View>
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.value}>
            {parameter.value}
          </Text>

          {parameter.value !== '--' && (
            <Text style={styles.unit}>
              {parameter.unit}
            </Text>
          )}
        </View>

        {parameter.value === '--' && (
          <Text style={styles.calibrationNote}>
            {parameter.status === 'uncalibrated'
              ? 'Sensor calibration required'
              : 'Waiting for sensor readings'}
          </Text>
        )}

        {parameter.isOffline && (
          <Text style={styles.offlineReadingNote}>
            Showing the last stored reading
          </Text>
        )}

        {(parameter.rawAdc !== null ||
          parameter.rawVoltage !== null) && (
          <View style={styles.rawBox}>
            <Text style={styles.rawTitle}>
              Raw Sensor Data
            </Text>

            {parameter.rawAdc !== null && (
              <View style={styles.rawRow}>
                <Text style={styles.rawLabel}>
                  ADC Reading
                </Text>

                <Text style={styles.rawValue}>
                  {parameter.rawAdc}
                </Text>
              </View>
            )}

            {parameter.rawVoltage !== null && (
              <View style={styles.rawRow}>
                <Text style={styles.rawLabel}>
                  Voltage
                </Text>

                <Text style={styles.rawValue}>
                  {formatVoltage(
                    parameter.rawVoltage
                  )} V
                </Text>
              </View>
            )}

            <Text style={styles.rawHint}>
              Raw electrical readings are not
              calibrated water-quality measurements.
            </Text>
          </View>
        )}

        {(parameter.minThreshold !== null ||
          parameter.maxThreshold !== null) && (
          <View style={styles.thresholdBox}>
            <Text style={styles.thresholdHeading}>
              Safe Range
            </Text>

            {parameter.minThreshold !== null && (
              <Text style={styles.threshold}>
                Minimum: {parameter.minThreshold}{' '}
                {parameter.unit}
              </Text>
            )}

            {parameter.maxThreshold !== null && (
              <Text style={styles.threshold}>
                Maximum: {parameter.maxThreshold}{' '}
                {parameter.unit}
              </Text>
            )}
          </View>
        )}

        {parameter.recordedAt && (
          <Text style={styles.readingTime}>
            Reading: {formatDate(parameter.recordedAt)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Welcome Oranine"
        subtitle="Monitor your water quality in real time"
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
                Pond Water Readings
              </Text>

              <Text style={styles.headingSubtitle}>
                Live water quality monitoring
              </Text>
            </View>

            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                Auto-refresh: 10s
              </Text>
            </View>
          </View>

          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Last checked: {formatDate(lastUpdated)}
            </Text>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={THEME.dark}
              />

              <Text style={styles.loadingText}>
                Loading water quality data...
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

              <Text style={styles.errorHint}>
                Check that Django is running on port 8000.
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
                    size={25}
                    color={overallTextColor}
                  />

                  <Text style={styles.overallLabel}>
                    Overall Water Quality
                  </Text>
                </View>

                <Text
                  style={[
                    styles.overallStatus,
                    { color: overallTextColor },
                  ]}
                >
                  {overallStatus}
                </Text>
              </View>

              {allOffline && (
                <View style={styles.offlineBanner}>
                  <Text style={styles.offlineTitle}>
                    Device is Offline
                  </Text>

                  <Text style={styles.offlineText}>
                    No recent sensor readings have been
                    received. Historical readings are
                    shown below.
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.parameterGrid,
                  isDesktop && styles.webParameterGrid,
                ]}
              >
                {parameters.map(renderParameter)}
              </View>

              {parameters.length === 0 && (
                <View style={styles.noDataCard}>
                  <Text style={styles.noDataTitle}>
                    No sensors found
                  </Text>

                  <Text style={styles.noDataText}>
                    Add sensors to your pond through
                    the Django API first.
                  </Text>
                </View>
              )}

              {activeAlerts.length > 0 && (
                <View style={styles.alertSection}>
                  <View style={styles.alertHeading}>
                    <Ionicons
                      name="warning-outline"
                      size={22}
                      color={COLORS.danger}
                    />

                    <Text style={styles.alertTitle}>
                      Active Alerts ({activeAlerts.length})
                    </Text>
                  </View>

                  {activeAlerts.map((alert) => (
                    <View
                      key={alert.alert_id}
                      style={styles.alertCard}
                    >
                      <Text style={styles.alertMessage}>
                        {alert.message}
                      </Text>

                      <Text style={styles.alertTime}>
                        {formatDate(alert.triggered_at)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
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
    padding: 0,
  },

  pageHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  headingSubtitle: {
    color: THEME.muted,
    fontSize: 14,
    marginTop: 5,
  },

  liveIndicator: {
    backgroundColor: THEME.soft,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
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

  lastUpdated: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  overallHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },

  overallLabel: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '800',
  },

  overallStatus: {
    fontSize: 16,
    fontWeight: '900',
  },

  offlineBanner: {
    backgroundColor: '#E2E8F0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },

  offlineTitle: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '800',
  },

  offlineText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  parameterGrid: {
    width: '100%',
    gap: 15,
  },

  webParameterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 0,
  },

  parameterCard: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    padding: 19,
    marginBottom: 15,
  },

  webParameterCard: {
    width: '49%',
    minWidth: 0,
  },

  parameterHeader: {
    marginBottom: 14,
  },

  parameterHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  sensorIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  parameterName: {
    flex: 1,
    color: THEME.text,
    fontSize: 17,
    fontWeight: '800',
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  status: {
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

  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },

  value: {
    color: THEME.text,
    fontSize: 32,
    fontWeight: '900',
  },

  unit: {
    color: THEME.muted,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 7,
  },

  calibrationNote: {
    color: '#A65B00',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
  },

  offlineReadingNote: {
    color: THEME.muted,
    fontSize: 12,
    marginTop: 6,
  },

  rawBox: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 11,
    padding: 13,
    marginTop: 14,
    marginBottom: 9,
  },

  rawTitle: {
    color: THEME.dark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },

  rawRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
    gap: 10,
  },

  rawLabel: {
    color: THEME.muted,
    fontSize: 13,
  },

  rawValue: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '800',
  },

  rawHint: {
    color: THEME.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },

  thresholdBox: {
    marginTop: 5,
  },

  thresholdHeading: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 5,
  },

  threshold: {
    color: THEME.muted,
    fontSize: 12,
    marginTop: 4,
  },

  readingTime: {
    color: THEME.muted,
    fontSize: 12,
    marginTop: 13,
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
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
    marginBottom: 7,
  },

  errorText: {
    color: '#7F1D1D',
    fontSize: 14,
  },

  errorHint: {
    color: '#991B1B',
    fontSize: 12,
    marginTop: 9,
  },

  alertSection: {
    marginTop: 15,
    marginBottom: 20,
  },

  alertHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },

  alertTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },

  alertCard: {
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: '#F3D9DF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 9,
  },

  alertMessage: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '700',
  },

  alertTime: {
    color: '#B91C1C',
    fontSize: 12,
    marginTop: 7,
  },

  noDataCard: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    padding: 18,
  },

  noDataTitle: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: '800',
  },

  noDataText: {
    color: THEME.muted,
    fontSize: 14,
    marginTop: 7,
  },
});
