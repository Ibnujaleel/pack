import { describe, it, expect } from 'vitest';
import { evaluateRestrictions } from '../evaluateRestrictions';
import { TRAVEL_STATUS } from '../../data/travelPolicies';

describe('Travel Restrictions Policy Evaluator', () => {
  const exampleJourney = {
    departureCountry: 'United Arab Emirates',
    destinationCountry: 'United Kingdom',
    destinationCity: 'London'
  };

  it('rejects evaluation if departure or destination country is missing', () => {
    const res1 = evaluateRestrictions([{ type: 'laptop_15', name: '15-inch laptop' }], {
      departureCountry: '',
      destinationCountry: 'United Kingdom'
    });
    expect(res1.isValid).toBe(false);
    expect(res1.error).toContain('departure and destination');

    const res2 = evaluateRestrictions([{ type: 'laptop_15', name: '15-inch laptop' }], {
      departureCountry: 'United Arab Emirates',
      destinationCountry: ''
    });
    expect(res2.isValid).toBe(false);
  });

  it('correctly matches UAE -> UK (London) route for laptop_15', () => {
    const items = [
      { id: 'laptop_15-1', type: 'laptop_15', name: '15-inch laptop', tags: ['electronics', 'fragile'] }
    ];

    const result = evaluateRestrictions(items, exampleJourney);
    expect(result.isValid).toBe(true);
    expect(result.results.length).toBe(1);

    const match = result.results[0];
    expect(match.itemType).toBe('laptop_15');
    expect(match.status).toBe(TRAVEL_STATUS.RESTRICTED);
    expect(match.statusLabel).toBe('Restricted / conditions apply');
    expect(match.sourceName).toContain('UK Civil Aviation Authority');
    expect(match.sourceUrl).toBeTruthy();
    expect(match.lastVerified).toBeTruthy();
    expect(match.conditions).toContain('Checked');
  });

  it('correctly flags TSA liquid pouch with cabin volume restrictions', () => {
    const items = [
      { id: 'tsa-1', type: 'tsa_liquid_pouch', name: 'TSA liquid pouch', tags: ['liquid', 'tsa'] }
    ];

    const result = evaluateRestrictions(items, exampleJourney);
    const match = result.results[0];
    expect(match.status).toBe(TRAVEL_STATUS.RESTRICTED);
    expect(match.baggageType).toBe('carry_on');
    expect(match.conditions).toContain('100ml');
  });

  it('correctly flags snack bar for UAE -> UK non-EU food biosecurity', () => {
    const items = [
      { id: 'snack-1', type: 'snack_bar', name: 'Snack Bar', tags: ['food'] }
    ];

    const result = evaluateRestrictions(items, exampleJourney);
    const match = result.results[0];
    expect(match.status).toBe(TRAVEL_STATUS.RESTRICTED);
    expect(match.sourceName).toContain('GOV.UK');
    expect(match.conditions).toContain('meat');
  });

  it('groups multiple instances of the same item without duplicating warnings', () => {
    const items = [
      { id: 'rolled_tshirt-1', type: 'rolled_tshirt', name: 'Rolled T-shirt', tags: [] },
      { id: 'rolled_tshirt-2', type: 'rolled_tshirt', name: 'Rolled T-shirt', tags: [] },
      { id: 'rolled_tshirt-3', type: 'rolled_tshirt', name: 'Rolled T-shirt', tags: [] },
      { id: 'laptop_15-1', type: 'laptop_15', name: '15-inch laptop', tags: ['electronics'] },
      { id: 'laptop_15-2', type: 'laptop_15', name: '15-inch laptop', tags: ['electronics'] }
    ];

    const result = evaluateRestrictions(items, exampleJourney);
    expect(result.summary.totalItemsCount).toBe(5);
    expect(result.summary.uniqueItemTypesCount).toBe(2);
    expect(result.results.length).toBe(2);

    const laptopResult = result.results.find((r) => r.itemType === 'laptop_15');
    expect(laptopResult.count).toBe(2);
    expect(laptopResult.instanceIds).toEqual(['laptop_15-1', 'laptop_15-2']);

    const tshirtResult = result.results.find((r) => r.itemType === 'rolled_tshirt');
    expect(tshirtResult.count).toBe(3);
    expect(tshirtResult.status).toBe(TRAVEL_STATUS.NO_RULE_FOUND);
  });

  it('returns "No specific rule found" for standard personal items and does not guarantee exemption', () => {
    const items = [
      { id: 'sneakers-1', type: 'sneakers', name: 'Sneakers', tags: [] }
    ];

    const result = evaluateRestrictions(items, exampleJourney);
    const match = result.results[0];
    expect(match.status).toBe(TRAVEL_STATUS.NO_RULE_FOUND);
    expect(match.statusLabel).toBe('No specific rule found');
    expect(match.explanation).toContain('does not confirm the item is exempt');
  });

  it('sorts restricted items before no-rule items', () => {
    const items = [
      { id: 'sneakers-1', type: 'sneakers', name: 'Sneakers', tags: [] },
      { id: 'laptop-1', type: 'laptop_15', name: '15-inch laptop', tags: ['electronics'] }
    ];

    const result = evaluateRestrictions(items, exampleJourney);
    expect(result.results[0].itemType).toBe('laptop_15');
    expect(result.results[1].itemType).toBe('sneakers');
  });

  it('correctly flags wallet for high-value currency declarations (£10,000+)', () => {
    const items = [{ id: 'wallet-1', type: 'wallet', name: 'Wallet', tags: [] }];
    const result = evaluateRestrictions(items, exampleJourney);
    const match = result.results[0];
    expect(match.status).toBe(TRAVEL_STATUS.RESTRICTED);
    expect(match.conditions).toContain('£10,000');
    expect(match.sourceName).toContain('GOV.UK');
  });

  it('correctly flags smartphone under PED battery regulations', () => {
    const items = [{ id: 'phone-1', type: 'smartphone', name: 'Smartphone', tags: ['electronics'] }];
    const result = evaluateRestrictions(items, exampleJourney);
    const match = result.results[0];
    expect(match.status).toBe(TRAVEL_STATUS.RESTRICTED);
    expect(match.sourceName).toContain('GCAA');
  });

  it('flags snack bar under Australian biosecurity when flying to Australia', () => {
    const items = [{ id: 'snack-1', type: 'snack_bar', name: 'Snack Bar', tags: ['food'] }];
    const result = evaluateRestrictions(items, {
      departureCountry: 'United Kingdom',
      destinationCountry: 'Australia',
      destinationCity: 'Sydney'
    });
    const match = result.results[0];
    expect(match.status).toBe(TRAVEL_STATUS.RESTRICTED);
    expect(match.sourceName).toContain('Australian Border Force');
    expect(match.conditions).toContain('AUD $6,260');
  });

  it('flags power bank as strictly prohibited in checked luggage', () => {
    const items = [{ id: 'pb-1', type: 'power_bank', name: 'Power Bank', tags: ['electronics'] }];
    const result = evaluateRestrictions(items, exampleJourney);
    const match = result.results[0];
    expect(match.status).toBe(TRAVEL_STATUS.PROHIBITED);
    expect(match.statusLabel).toBe('Prohibited');
    expect(match.baggageType).toBe('checked');
  });

  it('handles empty packing list gracefully without crashing', () => {
    const result = evaluateRestrictions([], exampleJourney);
    expect(result.isValid).toBe(true);
    expect(result.summary.totalItemsCount).toBe(0);
    expect(result.results).toEqual([]);
  });
});
