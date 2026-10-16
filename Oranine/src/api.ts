
import { Platform } from 'react-native';

// ============================================================
// AUTOMATIC API ADDRESS
// ============================================================

// Web on laptop:
//   http://localhost:8081 -> http://localhost:8000/api
//
// Web opened using laptop's LAN IP:
//   http://192.168.1.6:8081 -> http://192.168.1.6:8000/api
//
// Expo Go on phone:
//   Uses the laptop IP below. Update this only when
//   testing on a phone after changing Wi-Fi.
//
// For production, use a deployed HTTPS API instead.

const PHONE_API_HOST = '192.168.1.6';

function getApiBaseUrl(): string {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined'
  ) {
    const hostname = window.location.hostname;

    return `http://${hostname}:8000/api`;
  }

  return `http://${PHONE_API_HOST}:8000/api`;
}

export const API_BASE_URL = getApiBaseUrl();

let authToken: string | null = null;

// ============================================================
// API ENDPOINTS
// ============================================================

export const API = {
  farmers: `${API_BASE_URL}/farmers/`,
  ponds: `${API_BASE_URL}/ponds/`,
  devices: `${API_BASE_URL}/devices/`,
  sensors: `${API_BASE_URL}/sensors/`,
  readings: `${API_BASE_URL}/readings/`,
  alerts: `${API_BASE_URL}/alerts/`,

  register: `${API_BASE_URL}/auth/register/`,
  login: `${API_BASE_URL}/auth/login/`,
  me: `${API_BASE_URL}/auth/me/`,
  updateProfile: `${API_BASE_URL}/auth/profile/update/`,
  changePassword: `${API_BASE_URL}/auth/change-password/`,
  logout: `${API_BASE_URL}/auth/logout/`,

  passwordReset: `${API_BASE_URL}/auth/password-reset/`,
  passwordResetConfirm:
    `${API_BASE_URL}/auth/password-reset/confirm/`,
};

// ============================================================
// TYPES
// ============================================================

export type AuthUser = {
  id: number;
  user_id?: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  contact?: string;
  contact_number?: string;
  date_joined?: string;
};

export type RegisterData = {
  username: string;
  email: string;
  contact: string;
  password: string;
  confirm_password: string;
};

export type LoginData = {
  username: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export type UpdateProfileData = {
  username: string;
  email: string;
  contact: string;
};

export type UpdateProfileResponse = {
  message: string;
  user: AuthUser;
};

export type ChangePasswordData = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export type ChangePasswordResponse = {
  message: string;
  token: string;
};

export type ConfirmPasswordResetData = {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
};

export type PasswordResetResponse = {
  message: string;
};

// ============================================================
// TOKEN MANAGEMENT
// ============================================================

export function setAuthToken(
  token: string | null
): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// ============================================================
// API REQUEST HELPER
// ============================================================

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (authToken) {
    headers.set('Authorization', `Token ${authToken}`);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Cannot connect to Oranine server. Make sure Django is running and your device can reach the server.'
    );
  }

  const text = await response.text();

  let data: any = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        'Invalid response from Oranine server.'
      );
    }
  }

  if (!response.ok) {
    const errorMessage =
      data.error ||
      data.detail ||
      data.message ||
      `Request failed: ${response.status}`;

    let formattedError: string;

    if (Array.isArray(errorMessage)) {
      formattedError = errorMessage.join('\n');
    } else if (
      typeof errorMessage === 'object' &&
      errorMessage !== null
    ) {
      formattedError = Object.entries(errorMessage)
        .map(([key, value]) => {
          const message = Array.isArray(value)
            ? value.join(', ')
            : String(value);

          return `${key}: ${message}`;
        })
        .join('\n');
    } else {
      formattedError = String(errorMessage);
    }

    throw new Error(formattedError);
  }

  return data as T;
}

// ============================================================
// GET REQUEST
// ============================================================

export async function getApi<T>(
  url: string
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'GET',
  });
}

// ============================================================
// POST REQUEST
// ============================================================

export async function postApi<T>(
  url: string,
  body: unknown
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ============================================================
// PATCH REQUEST
// ============================================================

export async function patchApi<T>(
  url: string,
  body: unknown
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ============================================================
// FARMER REGISTRATION
// ============================================================

export async function registerFarmer(
  data: RegisterData
): Promise<{
  message: string;
  username: string;
}> {
  return postApi(API.register, data);
}

// ============================================================
// FARMER LOGIN
// ============================================================

export async function loginFarmer(
  data: LoginData
): Promise<LoginResponse> {
  const result = await postApi<LoginResponse>(
    API.login,
    data
  );

  setAuthToken(result.token);

  return result;
}

// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser(): Promise<AuthUser> {
  return getApi<AuthUser>(API.me);
}

// ============================================================
// EDIT FARMER PROFILE
// ============================================================

export async function updateFarmerProfile(
  data: UpdateProfileData
): Promise<UpdateProfileResponse> {
  return patchApi<UpdateProfileResponse>(
    API.updateProfile,
    data
  );
}

// ============================================================
// CHANGE FARMER PASSWORD
// ============================================================

export async function changeFarmerPassword(
  data: ChangePasswordData
): Promise<ChangePasswordResponse> {
  const result = await postApi<ChangePasswordResponse>(
    API.changePassword,
    data
  );

  // Django replaces the old token after a password change.
  if (!result.token) {
    setAuthToken(null);

    throw new Error(
      'Password changed, but no new session token was returned. Please log in again.'
    );
  }

  setAuthToken(result.token);

  return result;
}

// ============================================================
// REQUEST PASSWORD RESET
// ============================================================

export async function requestPasswordReset(
  email: string
): Promise<PasswordResetResponse> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error(
      'Please enter your email address.'
    );
  }

  return postApi<PasswordResetResponse>(
    API.passwordReset,
    {
      email: cleanEmail,
    }
  );
}

// ============================================================
// CONFIRM PASSWORD RESET
// ============================================================

export async function confirmPasswordReset(
  data: ConfirmPasswordResetData
): Promise<PasswordResetResponse> {
  if (
    !data.uid ||
    !data.token ||
    !data.new_password ||
    !data.confirm_password
  ) {
    throw new Error(
      'Please complete all password fields.'
    );
  }

  if (
    data.new_password !== data.confirm_password
  ) {
    throw new Error(
      'Passwords do not match.'
    );
  }

  return postApi<PasswordResetResponse>(
    API.passwordResetConfirm,
    data
  );
}

// ============================================================
// FARMER LOGOUT
// ============================================================

export async function logoutFarmer(): Promise<void> {
  try {
    if (authToken) {
      await postApi(API.logout, {});
    }
  } finally {
    setAuthToken(null);
  }
}
