export type ScreenName =
  | 'splash'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'analytics'
  | 'history'
  | 'profile';

export type MainScreen =
  | 'dashboard'
  | 'analytics'
  | 'history'
  | 'profile';

export type NavigationProps = {
  navigate: (screen: ScreenName) => void;
};

export type WaterReading = {
  id: string;
  name: string;
  value: number;
  unit: string;
  icon: string;

  safeLevel: string;

  minimum?: number;
  maximum?: number;

  minimumType?: 'greater-than' | 'at-least';
  maximumType?: 'less-than' | 'at-most';
};

export type HistoryRecord = {
  id: string;
  date: string;
  time: string;
  sensor: string;
  reading: string;
  status: 'Safe' | 'Warning';
};

export type UserProfile = {
  name: string;
  username: string;
  email: string;
  contact: string;
  address: string;
};