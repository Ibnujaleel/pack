/**
 * Mock Authentication Module for The Visa Guy & Layover Integration
 *
 * This is an explicit development prototype authentication module.
 * Real credentials are never stored or exposed; demo accounts are strictly for demonstration.
 */

export const DEMO_CREDENTIALS = {
  email: 'alfaz@visaguy.ae',
  password: 'layover2026',
  user: {
    id: 'usr_tvg_8819',
    name: 'Mr. Alfaz',
    email: 'alfaz@visaguy.ae',
    phone: '+971 50 123 4567',
    avatar: null,
    originCity: 'Dubai',
    originCountry: 'United Arab Emirates',
    destinationCity: 'London',
    destinationCountry: 'United Kingdom'
  }
};

const STORAGE_KEY = 'tvg_mock_session_v1';

let inMemorySession = null;

/**
 * Validates login credentials against demo credentials.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
 */
export async function mockLogin(email, password) {
  // Simulate brief network latency for realistic feel
  await new Promise((resolve) => setTimeout(resolve, 350));

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail || !cleanPass) {
    return {
      success: false,
      error: 'Please enter both email address and password.'
    };
  }

  // Accept primary demo account or common demo shortcut
  const isMatch =
    (cleanEmail === DEMO_CREDENTIALS.email && cleanPass === DEMO_CREDENTIALS.password) ||
    (cleanEmail === 'demo@visaguy.ae' && cleanPass === 'password123');

  if (isMatch) {
    const session = {
      ...DEMO_CREDENTIALS.user,
      email: cleanEmail,
      loggedInAt: new Date().toISOString()
    };
    inMemorySession = session;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
    } catch {
      // Storage unavailable fallback
    }
    return { success: true, user: session };
  }

  return {
    success: false,
    error: 'Invalid credentials. Use demo email: alfaz@visaguy.ae with password: layover2026'
  };
}

/**
 * Signs out the current mock user and clears local session.
 */
export function mockLogout() {
  inMemorySession = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable fallback
  }
}

/**
 * Retrieves the currently persisted mock session if present.
 * @returns {object|null}
 */
export function getStoredSession() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // Storage unavailable fallback
  }
  return inMemorySession;
}

export default {
  DEMO_CREDENTIALS,
  mockLogin,
  mockLogout,
  getStoredSession
};
