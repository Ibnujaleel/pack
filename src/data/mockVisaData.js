/**
 * Mock Visa and Journey Dataset for The Visa Guy Portal
 *
 * All data in this file is explicitly simulated for product demonstration purposes.
 * It demonstrates integration between visa sanctioning workflows and baggage preparation.
 */

export const MOCK_VISA_JOURNEY = {
  applicationId: 'TVG-882194-GB',
  traveler: {
    title: 'Mr.',
    name: 'Mr. Alfaz',
    passportNumber: 'N••••••82',
    nationality: 'United Arab Emirates'
  },
  journey: {
    departureCity: 'Dubai',
    departureCountry: 'United Arab Emirates',
    departureAirportCode: 'DXB',
    departureCountryCode: 'AE',
    departureFlag: '🇦🇪',
    destinationCity: 'London',
    destinationCountry: 'United Kingdom',
    destinationAirportCode: 'LHR',
    destinationCountryCode: 'GB',
    destinationFlag: '🇬🇧',
    flightDate: '15 Oct 2026',
    returnDate: '28 Oct 2026',
    durationDays: 14,
    airline: 'Emirates / British Airways',
    flightNumber: 'EK 029'
  },
  visa: {
    type: 'UK Standard Visitor Visa (Multiple Entry)',
    category: 'Tourism & Professional Travel',
    status: 'Sanctioned',
    statusBadgeText: 'Visa Sanctioned (Demo)',
    isDemo: true,
    issueDate: '08 Oct 2026',
    validFrom: '10 Oct 2026',
    validUntil: '10 Apr 2027',
    issuingAuthority: 'UK Visas and Immigration (UKVI) / British Embassy UAE',
    decisionReference: 'GWF-0918842-DEMO'
  },
  journeyStatus: 'Ready for travel preparation',
  expert: {
    name: 'Tariq Al-Mansoor',
    title: 'Senior Travel & Visa Consultant',
    status: 'Available now',
    phone: '+971 4 800 VISA'
  },
  stats: [
    { label: 'Visas Processed', value: '80k+' },
    { label: 'Assisted Countries', value: '75+' },
    { label: 'Visa Status', value: 'Sanctioned' }
  ],
  assistedCountries: [
    'United Kingdom',
    'Italy',
    'Spain',
    'Germany',
    'France',
    'United States',
    'Canada',
    'Japan',
    'India',
    'Australia',
    'Thailand',
    'Singapore',
    'Switzerland',
    'Netherlands'
  ]
};

export default MOCK_VISA_JOURNEY;
