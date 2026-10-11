import { describe, it, expect, beforeEach } from 'vitest';
import { mockLogin, mockLogout, getStoredSession, DEMO_CREDENTIALS } from '../mockAuth';
import { MOCK_VISA_JOURNEY } from '../mockVisaData';

describe('The Visa Guy Mock Authentication & Portal Data', () => {
  beforeEach(() => {
    mockLogout();
  });

  it('successfully authenticates with primary demo credentials', async () => {
    const result = await mockLogin(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.name).toBe('Mr. Alfaz');
    expect(result.user.email).toBe(DEMO_CREDENTIALS.email);

    // Verifies session is stored in storage
    const stored = getStoredSession();
    expect(stored).not.toBeNull();
    expect(stored.name).toBe('Mr. Alfaz');
  });

  it('supports lowercase email matching and trimmed inputs', async () => {
    const result = await mockLogin(' ALFAZ@VISAGUY.AE ', 'layover2026');
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('alfaz@visaguy.ae');
  });

  it('rejects incorrect password with helpful message', async () => {
    const result = await mockLogin('alfaz@visaguy.ae', 'wrongpass123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid credentials');
    expect(getStoredSession()).toBeNull();
  });

  it('validates empty email or password', async () => {
    const result1 = await mockLogin('', 'layover2026');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('Please enter both');

    const result2 = await mockLogin('alfaz@visaguy.ae', '');
    expect(result2.success).toBe(false);
  });

  it('clears stored session upon logout', async () => {
    await mockLogin(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    expect(getStoredSession()).not.toBeNull();

    mockLogout();
    expect(getStoredSession()).toBeNull();
  });

  it('contains expected visa journey details for Dubai to London', () => {
    expect(MOCK_VISA_JOURNEY.traveler.name).toBe('Mr. Alfaz');
    expect(MOCK_VISA_JOURNEY.journey.departureCity).toBe('Dubai');
    expect(MOCK_VISA_JOURNEY.journey.departureCountry).toBe('United Arab Emirates');
    expect(MOCK_VISA_JOURNEY.journey.destinationCity).toBe('London');
    expect(MOCK_VISA_JOURNEY.journey.destinationCountry).toBe('United Kingdom');
    expect(MOCK_VISA_JOURNEY.visa.status).toBe('Sanctioned');
    expect(MOCK_VISA_JOURNEY.visa.isDemo).toBe(true);
  });
});
