
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  unit: string;
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
  | { results: T[]; next?: string | null };

type HistoryItem = Reading & {
  sensorName: string;
  sensorType: string;
  unit: string;
  isCalibrated: boolean;
};

type FilterType = 'sensor' | 'status' | null;

const THEME = {
  dark: '#67318A',
  lavender: '#CDA0F2',
  soft: '#F4EAFB',
  background: '#F8F7FA',
  white: '#FFFFFF',
  text: '#30243A',
  muted: '#63586D',
  border: '#E8E1EC',
  warning: '#A65B00',
};

const PAGE_SIZE = 20;
const REFRESH_INTERVAL = 10000;

const STATUS_OPTIONS = [
  'All',
  'Safe',
  'Unsafe',
  'Uncalibrated',
];

function unpackList<T>(data: ApiList<T>) {
  if (Array.isArray(data)) {
    return { items: data, hasMore: false };
  }

  return {
    items: Array.isArray(data?.results) ? data.results : [],
    hasMore: Boolean(data?.next),
  };
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

function sensorIcon(
  type: string
): keyof typeof Ionicons.glyphMap {
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

  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString();
}

function formatTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '--'
    : date.toLocaleTimeString();
}

function effectiveStatus(item: HistoryItem): string {
  return item.isCalibrated
    ? item.status.toLowerCase()
    : 'uncalibrated';
}

function statusColor(status: string): string {
  switch (status) {
    case 'safe':
      return COLORS.success;
    case 'unsafe':
      return COLORS.danger;
    case 'uncalibrated':
      return THEME.warning;
    default:
      return THEME.muted;
  }
}

function statusBackground(status: string): string {
  switch (status) {
    case 'safe':
      return '#E7F7EC';
    case 'unsafe':
      return '#FFF0F0';
    case 'uncalibrated':
      return '#FFF5DF';
    default:
      return '#F1F2F5';
  }
}

function readingText(item: HistoryItem): string {
  const value = numericValue(item.value);

  if (item.isCalibrated && value !== null) {
    return `${value.toFixed(2)} ${item.unit}`;
  }

  const voltage = numericValue(item.raw_voltage);

  if (voltage !== null) {
    return `${voltage.toFixed(2)} V`;
  }

  if (item.raw_adc !== null) {
    return `${item.raw_adc} ADC`;
  }

  return 'No measurement available';
}

export default function HistoryScreen({
  navigate,
}: NavigationProps) {
  const { width } = useWindowDimensions();
  const isDesktop =
    Platform.OS === 'web' && width >= 900;

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [search, setSearch] = useState('');
  const [sensorFilter, setSensorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [openFilter, setOpenFilter] =
    useState<FilterType>(null);

  const [visibleCount, setVisibleCount] =
    useState(PAGE_SIZE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] =
    useState<string | null>(null);
  const [serverHasMore, setServerHasMore] =
    useState(false);

  const mounted = useRef(true);
  const requestInProgress = useRef(false);

  const loadHistory = useCallback(async () => {
    if (requestInProgress.current) return;
    requestInProgress.current = true;

    try {
      const [sensorResponse, readingResponse] =
        await Promise.all([
          getApi<ApiList<Sensor>>(API.sensors),
          getApi<ApiList<Reading>>(API.readings),
        ]);

      if (!mounted.current) return;

      const sensorData = unpackList(sensorResponse);
      const readingData = unpackList(readingResponse);

      setSensors(sensorData.items);
      setReadings(readingData.items);
      setServerHasMore(readingData.hasMore);
      setLastChecked(new Date().toISOString());
      setError('');
    } catch (err) {
      if (mounted.current) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load reading history.'
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
    loadHistory();

    const interval = setInterval(
      loadHistory,
      REFRESH_INTERVAL
    );

    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [loadHistory]);

  const refresh = () => {
    if (requestInProgress.current) return;
    setRefreshing(true);
    loadHistory();
  };

  const historyItems = useMemo(() => {
    const sensorMap = new Map<number, Sensor>();

    sensors.forEach((sensor) => {
      sensorMap.set(sensor.sensor_id, sensor);
    });

    return readings
      .map((reading): HistoryItem => {
        const sensor = sensorMap.get(reading.sensor);
        const type = sensor?.type ?? 'Unknown Sensor';

        return {
          ...reading,
          sensorName: sensorName(type),
          sensorType: type,
          unit: sensor?.unit ?? '',
          isCalibrated:
            type.toLowerCase() === 'temperature',
        };
      })
      .sort((a, b) => {
        const difference =
          new Date(b.recorded_at).getTime() -
          new Date(a.recorded_at).getTime();

        return difference || b.reading_id - a.reading_id;
      });
  }, [sensors, readings]);

  const sensorOptions = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(sensors.map((sensor) =>
          sensorName(sensor.type)
        ))
      ),
    ];
  }, [sensors]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return historyItems.filter((item) => {
      const status = effectiveStatus(item);

      const matchesSensor =
        sensorFilter === 'All' ||
        item.sensorName === sensorFilter;

      const matchesStatus =
        statusFilter === 'All' ||
        status === statusFilter.toLowerCase();

      const searchable = [
        item.sensorName,
        status,
        formatDate(item.recorded_at),
        formatTime(item.recorded_at),
        readingText(item),
        String(item.reading_id),
      ]
        .join(' ')
        .toLowerCase();

      return (
        matchesSensor &&
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [
    historyItems,
    search,
    sensorFilter,
    statusFilter,
  ]);

  const visibleItems = filteredItems.slice(
    0,
    visibleCount
  );

  const selectFilter = (value: string) => {
    if (openFilter === 'sensor') {
      setSensorFilter(value);
    } else if (openFilter === 'status') {
      setStatusFilter(value);
    }

    setVisibleCount(PAGE_SIZE);
    setOpenFilter(null);
  };

  const dropdownOptions =
    openFilter === 'sensor'
      ? sensorOptions
      : STATUS_OPTIONS;

  const renderRecord = ({
    item,
  }: {
    item: HistoryItem;
  }) => {
    const status = effectiveStatus(item);

    return (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={styles.recordHeadingLeft}>
            <View style={styles.sensorIconBox}>
              <Ionicons
                name={sensorIcon(item.sensorType)}
                size={23}
                color={THEME.dark}
              />
            </View>

            <Text style={styles.sensorName}>
              {item.sensorName}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusBackground(status),
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: statusColor(status) },
              ]}
            >
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Ionicons
            name="calendar-outline"
            size={17}
            color={THEME.muted}
          />

          <Text style={styles.detail}>
            {formatDate(item.recorded_at)}
          </Text>

          <Ionicons
            name="time-outline"
            size={17}
            color={THEME.muted}
          />

          <Text style={styles.detail}>
            {formatTime(item.recorded_at)}
          </Text>
        </View>

        <Text style={styles.readingLabel}>
          {item.isCalibrated
            ? 'Water Quality Reading'
            : 'Raw Sensor Reading'}
        </Text>

        <Text style={styles.reading}>
          {readingText(item)}
        </Text>

        {!item.isCalibrated && (
          <View style={styles.calibrationBox}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={THEME.warning}
            />

            <Text style={styles.calibrationNote}>
              Uncalibrated — this is raw electrical
              data, not a confirmed water-quality value.
            </Text>
          </View>
        )}

        {(item.raw_adc !== null ||
          item.raw_voltage !== null) && (
          <View style={styles.rawContainer}>
            {item.raw_adc !== null && (
              <Text style={styles.rawText}>
                ADC: {item.raw_adc}
              </Text>
            )}

            {item.raw_voltage !== null && (
              <Text style={styles.rawText}>
                Voltage:{' '}
                {numericValue(
                  item.raw_voltage
                )?.toFixed(2) ?? '--'}{' '}
                V
              </Text>
            )}
          </View>
        )}

        <Text style={styles.recordId}>
          Record #{item.reading_id}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="History"
        subtitle="Previous water quality records"
      />

      <View style={styles.main}>
        <View
          style={[
            styles.content,
            isDesktop && styles.webContent,
          ]}
        >
          <View style={styles.headingSection}>
            <Text style={styles.heading}>
              Reading History
            </Text>

            <Text style={styles.subtitle}>
              Search and review previous sensor records
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={22}
              color={THEME.dark}
            />

            <TextInput
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search sensor, date, reading..."
              placeholderTextColor={THEME.muted}
              style={styles.searchInput}
              accessibilityLabel="Search history records"
            />

            {search.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearch('');
                  setVisibleCount(PAGE_SIZE);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons
                  name="close-circle"
                  size={23}
                  color={THEME.muted}
                />
              </Pressable>
            )}
          </View>

          {/* TWO DROPDOWN FILTERS */}
          <View
            style={[
              styles.filterContainer,
              isDesktop && styles.webFilterContainer,
            ]}
          >
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>
                Filter by Sensor
              </Text>

              <Pressable
                style={styles.dropdown}
                onPress={() => setOpenFilter('sensor')}
                accessibilityRole="button"
                accessibilityLabel={`Sensor filter: ${sensorFilter}`}
              >
                <Text style={styles.dropdownText}>
                  {sensorFilter === 'All'
                    ? 'All Sensors'
                    : sensorFilter}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={21}
                  color={THEME.dark}
                />
              </Pressable>
            </View>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>
                Filter by Status
              </Text>

              <Pressable
                style={styles.dropdown}
                onPress={() => setOpenFilter('status')}
                accessibilityRole="button"
                accessibilityLabel={`Status filter: ${statusFilter}`}
              >
                <Text style={styles.dropdownText}>
                  {statusFilter === 'All'
                    ? 'All Statuses'
                    : statusFilter}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={21}
                  color={THEME.dark}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {filteredItems.length} matching records loaded
            </Text>

            {lastChecked && (
              <Text style={styles.summaryText}>
                Updated: {formatTime(lastChecked)}
              </Text>
            )}
          </View>

          {serverHasMore && (
            <View style={styles.noticeCard}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#92400E"
              />

              <Text style={styles.noticeText}>
                More records are available in Django.
                Filters currently cover loaded records only.
              </Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Connection Error
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <Pressable
                onPress={refresh}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>
                  Retry Loading
                </Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={THEME.dark}
              />

              <Text style={styles.loadingText}>
                Loading sensor history...
              </Text>
            </View>
          ) : (
            /* SCROLLABLE HISTORY AREA */
            <FlatList
              style={styles.historyList}
              data={visibleItems}
              keyExtractor={(item) =>
                String(item.reading_id)
              }
              renderItem={renderRecord}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={THEME.dark}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Ionicons
                    name="document-text-outline"
                    size={34}
                    color={THEME.dark}
                  />

                  <Text style={styles.emptyTitle}>
                    No matching records
                  </Text>

                  <Text style={styles.emptyText}>
                    Try another search or filter.
                  </Text>
                </View>
              }
              ListFooterComponent={
                visibleCount < filteredItems.length ? (
                  <Pressable
                    style={styles.loadMoreButton}
                    onPress={() =>
                      setVisibleCount(
                        (count) => count + PAGE_SIZE
                      )
                    }
                  >
                    <Text style={styles.loadMoreText}>
                      Load More Records
                    </Text>

                    <Ionicons
                      name="chevron-down"
                      size={19}
                      color={THEME.dark}
                    />
                  </Pressable>
                ) : filteredItems.length > 0 ? (
                  <Text style={styles.endText}>
                    End of loaded records
                  </Text>
                ) : null
              }
            />
          )}
        </View>
      </View>

      <BottomNavigation
        active="history"
        navigate={navigate}
      />

      {/* DROPDOWN CHOICE MODAL */}
      <Modal
        visible={openFilter !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenFilter(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {openFilter === 'sensor'
                  ? 'Select Sensor'
                  : 'Select Status'}
              </Text>

              <Pressable
                onPress={() => setOpenFilter(null)}
                accessibilityRole="button"
                accessibilityLabel="Close dropdown"
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={25}
                  color={THEME.dark}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.optionList}
              showsVerticalScrollIndicator
            >
              {dropdownOptions.map((option) => {
                const selected =
                  openFilter === 'sensor'
                    ? sensorFilter === option
                    : statusFilter === option;

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionButton,
                      selected && styles.selectedOption,
                    ]}
                    onPress={() => selectFilter(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected &&
                          styles.selectedOptionText,
                      ]}
                    >
                      {option === 'All'
                        ? openFilter === 'sensor'
                          ? 'All Sensors'
                          : 'All Statuses'
                        : option}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={23}
                        color={THEME.dark}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },

  main: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
  },

  content: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    paddingHorizontal: 14,
    paddingTop: 18,
  },

  webContent: {
    maxWidth: 1080,
    paddingHorizontal: 28,
    paddingTop: 24,
  },

  headingSection: {
    marginBottom: 17,
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

  searchContainer: {
    minHeight: 52,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    color: THEME.text,
    fontSize: 15,
  },

  filterContainer: {
    gap: 12,
    marginBottom: 15,
  },

  webFilterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },

  filterField: {
    flex: 1,
    minWidth: 0,
  },

  filterLabel: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 9,
  },

  dropdown: {
    minHeight: 52,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 11,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  dropdownText: {
    flex: 1,
    color: THEME.dark,
    fontSize: 15,
    fontWeight: '700',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 13,
  },

  summaryText: {
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  noticeCard: {
    backgroundColor: '#FFF5DF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  noticeText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  historyList: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },

  listContent: {
    paddingBottom: 24,
  },

  recordCard: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 15,
    padding: 17,
    marginBottom: 12,
  },

  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 13,
  },

  recordHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },

  sensorIconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sensorName: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: '800',
    flexShrink: 1,
  },

  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 9,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 13,
  },

  detail: {
    color: THEME.muted,
    fontSize: 13,
    marginRight: 9,
  },

  readingLabel: {
    color: THEME.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 5,
  },

  reading: {
    color: THEME.text,
    fontSize: 25,
    fontWeight: '900',
  },

  calibrationBox: {
    backgroundColor: '#FFF7E9',
    padding: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },

  calibrationNote: {
    color: THEME.warning,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  rawContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 12,
    padding: 11,
    backgroundColor: THEME.background,
    borderRadius: 10,
  },

  rawText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '700',
  },

  recordId: {
    color: THEME.muted,
    fontSize: 11,
    marginTop: 12,
  },

  loadMoreButton: {
    backgroundColor: THEME.soft,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  loadMoreText: {
    color: THEME.dark,
    fontSize: 15,
    fontWeight: '800',
  },

  endText: {
    color: THEME.muted,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 16,
  },

  emptyCard: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 12,
  },

  emptyTitle: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: THEME.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 7,
  },

  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },

  loadingText: {
    color: THEME.muted,
    fontSize: 14,
    marginTop: 12,
  },

  errorCard: {
    backgroundColor: '#FEE2E2',
    padding: 17,
    borderRadius: 13,
  },

  errorTitle: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '800',
  },

  errorText: {
    color: '#991B1B',
    fontSize: 13,
    marginTop: 7,
  },

  retryButton: {
    backgroundColor: '#991B1B',
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 17,
    alignSelf: 'flex-start',
    marginTop: 13,
  },

  retryText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 20, 40, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '80%',
    backgroundColor: THEME.white,
    borderRadius: 18,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  modalTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '800',
  },

  closeButton: {
    padding: 5,
  },

  optionList: {
    flexGrow: 0,
  },

  optionButton: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: THEME.background,
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedOption: {
    backgroundColor: THEME.soft,
    borderColor: THEME.lavender,
  },

  optionText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },

  selectedOptionText: {
    color: THEME.dark,
    fontWeight: '800',
  },
});
