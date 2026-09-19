import {
  HistoryRecord,
  UserProfile,
  WaterReading,
} from '../types';

export const WATER_READINGS: WaterReading[] = [
  {
    id: 'dissolved-oxygen',
    name: 'Dissolved Oxygen',
    value: 6.8,
    unit: 'mg/L',
    icon: 'water',

    safeLevel: 'Greater than 5 mg/L',

    minimum: 5,
    minimumType: 'greater-than',
  },
  {
    id: 'ph',
    name: 'pH Level',
    value: 7.4,
    unit: 'pH',
    icon: 'flask',

    safeLevel: '6.5–9.5 pH',

    minimum: 6.5,
    maximum: 9.5,
    minimumType: 'at-least',
    maximumType: 'at-most',
  },
  {
    id: 'temperature',
    name: 'Temperature',
    value: 29.6,
    unit: '°C',
    icon: 'thermometer',

    safeLevel: '28–32°C',

    minimum: 28,
    maximum: 32,
    minimumType: 'at-least',
    maximumType: 'at-most',
  },
  {
    id: 'turbidity',
    name: 'Turbidity',
    value: 12.3,
    unit: 'NTU',
    icon: 'eye',

    safeLevel: 'Less than 25 NTU',

    maximum: 25,
    maximumType: 'less-than',
  },
];

export const HISTORY_RECORDS: HistoryRecord[] = [
  {
    id: '1',
    date: 'August 19, 2026',
    time: '2:30 PM',
    sensor: 'Dissolved Oxygen',
    reading: '6.8 mg/L',
    status: 'Safe',
  },
  {
    id: '2',
    date: 'August 19, 2026',
    time: '2:30 PM',
    sensor: 'pH Level',
    reading: '7.4 pH',
    status: 'Safe',
  },
  {
    id: '3',
    date: 'August 19, 2026',
    time: '2:30 PM',
    sensor: 'Temperature',
    reading: '29.6°C',
    status: 'Safe',
  },
  {
    id: '4',
    date: 'August 19, 2026',
    time: '2:30 PM',
    sensor: 'Turbidity',
    reading: '12.3 NTU',
    status: 'Safe',
  },
  {
    id: '5',
    date: 'August 18, 2026',
    time: '4:20 PM',
    sensor: 'Turbidity',
    reading: '27.4 NTU',
    status: 'Warning',
  },
];

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Orange Mercado',
  username: 'orange',
  email: 'orange@example.com',
  contact: '09XX XXX XXXX',
  address: 'Iligan City, Philippines',
};

export const readingIsSafe = (
  reading: WaterReading
): boolean => {
  if (reading.minimum !== undefined) {
    if (
      reading.minimumType === 'greater-than' &&
      reading.value <= reading.minimum
    ) {
      return false;
    }

    if (
      reading.minimumType === 'at-least' &&
      reading.value < reading.minimum
    ) {
      return false;
    }
  }

  if (reading.maximum !== undefined) {
    if (
      reading.maximumType === 'less-than' &&
      reading.value >= reading.maximum
    ) {
      return false;
    }

    if (
      reading.maximumType === 'at-most' &&
      reading.value > reading.maximum
    ) {
      return false;
    }
  }

  return true;
};