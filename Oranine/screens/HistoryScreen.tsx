import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/theme';
import { HISTORY_RECORDS } from '../data/sampleData';
import { NavigationProps } from '../types';

import Header from '../src/components/Header';
import BottomNavigation from '../src/components/BottomNavigation';

export default function HistoryScreen({
  navigate,
}: NavigationProps) {
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo(() => {
    const searchText = search.toLowerCase();

    return HISTORY_RECORDS.filter((record) => {
      const recordText =
        `${record.date} ${record.sensor} ${record.status}`.toLowerCase();

      return recordText.includes(searchText);
    });
  }, [search]);

  return (
    <View style={styles.container}>
      <Header
        title="History"
        subtitle="View previous water quality records"
      />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={19}
            color={COLORS.black}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No records found.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.sensorName}>
                  {item.sensor}
                </Text>

                <Text
                  style={[
                    styles.status,
                    {
                      color:
                        item.status === 'Safe'
                          ? COLORS.success
                          : COLORS.danger,
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>

              <Text style={styles.detail}>
                Date: {item.date}
              </Text>

              <Text style={styles.detail}>
                Time: {item.time}
              </Text>

              <Text style={styles.reading}>
                Reading: {item.reading}
              </Text>
            </View>
          )}
        />
      </View>

      <BottomNavigation
        active="history"
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
    flex: 1,
    padding: 11,
    margin: 12,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },

  searchContainer: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.text,
  },

  list: {
    paddingTop: 10,
    paddingBottom: 15,
  },

  recordCard: {
    padding: 14,
    marginBottom: 9,
    borderRadius: 13,
    backgroundColor: COLORS.card,
  },

  recordHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sensorName: {
    color: COLORS.text,
    fontWeight: '900',
  },

  status: {
    fontSize: 11,
    fontWeight: '900',
  },

  detail: {
    marginBottom: 3,
    color: COLORS.muted,
    fontSize: 11,
  },

  reading: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },

  emptyText: {
    marginTop: 30,
    color: COLORS.white,
    textAlign: 'center',
  },
});