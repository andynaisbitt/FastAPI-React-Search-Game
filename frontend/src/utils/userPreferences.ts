/**
 * User Preferences Utility
 * Manages user settings stored in localStorage
 */

const STORAGE_KEY = 'jfgi-user-prefs';

export interface UserPreferences {
  nickname: string;
  lastUpdated: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  nickname: 'Anonymous',
  lastUpdated: new Date().toISOString(),
};

/**
 * Get user preferences from localStorage
 */
export const getUserPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading user preferences:', error);
  }
  return { ...DEFAULT_PREFERENCES };
};

/**
 * Save user preferences to localStorage
 */
export const saveUserPreferences = (preferences: Partial<UserPreferences>): void => {
  try {
    const current = getUserPreferences();
    const updated = {
      ...current,
      ...preferences,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

/**
 * Get user nickname
 */
export const getUserNickname = (): string => {
  return getUserPreferences().nickname;
};

/**
 * Set user nickname
 */
export const setUserNickname = (nickname: string): void => {
  saveUserPreferences({ nickname: nickname.trim() || 'Anonymous' });
};

/**
 * Clear all user preferences
 */
export const clearUserPreferences = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user preferences:', error);
  }
};
