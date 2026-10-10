import {
  TRAVEL_POLICIES,
  TRAVEL_STATUS,
  STATUS_LABELS,
  BAGGAGE_TYPES,
  BAGGAGE_LABELS
} from '../data/travelPolicies.js';

/**
 * Normalizes a string for case-insensitive and trimmed comparisons.
 */
function normalize(str) {
  return (str || '').trim().toLowerCase();
}

/**
 * Calculates a specificity score for a policy matching a given journey.
 * Higher score = more specific match.
 */
function calculatePolicyScore(policy, journey) {
  const dep = normalize(journey.departureCountry);
  const dest = normalize(journey.destinationCountry);
  const city = normalize(journey.destinationCity);

  const polDep = policy.departureCountry ? normalize(policy.departureCountry) : null;
  const polDest = policy.destinationCountry ? normalize(policy.destinationCountry) : null;
  const polCity = policy.destinationCity ? normalize(policy.destinationCity) : null;

  // If policy requires a departure country that doesn't match, score 0
  if (polDep && polDep !== dep) return 0;
  // If policy requires a destination country that doesn't match, score 0
  if (polDest && polDest !== dest) return 0;
  // If policy requires a city, only match if the journey matches that city
  if (polCity && (!city || polCity !== city)) return 0;

  let score = 10; // Base score for global/universal rule

  if (polDep && polDest && polCity) {
    score = 100; // Exact route + city match
  } else if (polDep && polDest) {
    score = 80;  // Exact bilateral route match
  } else if (polDest) {
    score = 50;  // Destination customs/security match
  } else if (polDep) {
    score = 40;  // Departure airport security match
  }

  return score;
}

/**
 * Finds the most relevant policy for a specific item given the journey.
 */
function findBestPolicyForItem(item, journey) {
  const itemType = item.type;
  const itemTags = item.tags || [];

  // Filter policies that match either the item's type or any of its tags
  const matchingPolicies = TRAVEL_POLICIES.filter((pol) => {
    const categories = Array.isArray(pol.categoryOrType)
      ? pol.categoryOrType
      : [pol.categoryOrType];

    const matchesType = categories.includes(itemType);
    const matchesTag = categories.some((cat) => itemTags.includes(cat));

    return matchesType || matchesTag;
  });

  if (matchingPolicies.length === 0) {
    return null;
  }

  // Score each matching policy against the journey
  let bestPolicy = null;
  let highestScore = 0;

  for (const policy of matchingPolicies) {
    const score = calculatePolicyScore(policy, journey);
    if (score > highestScore) {
      highestScore = score;
      bestPolicy = policy;
    }
  }

  // If score is 0, no route-compatible policy was found
  return highestScore > 0 ? bestPolicy : null;
}

/**
 * Evaluates a list of packed items against travel policies for a specific journey.
 * 
 * @param {Array} items - List of items in the packing list
 * @param {Object} journey - { departureCountry, destinationCountry, destinationCity }
 * @returns {Object} Evaluation report containing summary and grouped results
 */
export function evaluateRestrictions(items = [], journey = {}) {
  const departureCountry = (journey.departureCountry || '').trim();
  const destinationCountry = (journey.destinationCountry || '').trim();
  const destinationCity = (journey.destinationCity || '').trim();

  // Validate required inputs
  if (!departureCountry || !destinationCountry) {
    return {
      isValid: false,
      error: 'Please select both departure and destination countries to check travel restrictions.',
      journey: { departureCountry, destinationCountry, destinationCity },
      summary: null,
      results: []
    };
  }

  // Group items by type to prevent duplicate warnings for multiple quantities
  const groupedItems = new Map();
  for (const item of items) {
    if (!groupedItems.has(item.type)) {
      groupedItems.set(item.type, {
        itemType: item.type,
        name: item.name || item.type,
        color: item.color,
        tags: item.tags || [],
        count: 0,
        instances: []
      });
    }
    const group = groupedItems.get(item.type);
    group.count += 1;
    group.instances.push(item);
  }

  const results = [];
  let prohibitedCount = 0;
  let restrictedCount = 0;
  let needsVerificationCount = 0;
  let noRuleFoundCount = 0;

  for (const group of groupedItems.values()) {
    const sampleItem = group.instances[0];
    const policy = findBestPolicyForItem(sampleItem, {
      departureCountry,
      destinationCountry,
      destinationCity
    });

    if (policy) {
      const status = policy.status;
      if (status === TRAVEL_STATUS.PROHIBITED) prohibitedCount += 1;
      else if (status === TRAVEL_STATUS.RESTRICTED) restrictedCount += 1;
      else if (status === TRAVEL_STATUS.NEEDS_VERIFICATION) needsVerificationCount += 1;
      else noRuleFoundCount += 1;

      results.push({
        itemType: group.itemType,
        name: group.name,
        color: group.color,
        count: group.count,
        instanceIds: group.instances.map((it) => it.id),
        status: policy.status,
        statusLabel: STATUS_LABELS[policy.status] || policy.status,
        title: policy.title,
        explanation: policy.explanation,
        conditions: policy.conditions || '',
        baggageType: policy.baggageType || BAGGAGE_TYPES.BOTH,
        baggageLabel: BAGGAGE_LABELS[policy.baggageType] || 'Cabin & checked baggage',
        sourceName: policy.sourceName,
        sourceUrl: policy.sourceUrl,
        lastVerified: policy.lastVerified,
        confidence: policy.confidence,
        jurisdiction: policy.jurisdiction || 'Aviation & Customs Authorities',
        policyId: policy.id
      });
    } else {
      // Default: No specific rule found for this item
      // Rule: Never interpret "no specific rule found" as confirmation that an item is allowed.
      noRuleFoundCount += 1;
      results.push({
        itemType: group.itemType,
        name: group.name,
        color: group.color,
        count: group.count,
        instanceIds: group.instances.map((it) => it.id),
        status: TRAVEL_STATUS.NO_RULE_FOUND,
        statusLabel: STATUS_LABELS[TRAVEL_STATUS.NO_RULE_FOUND],
        title: `${group.name} - General Item`,
        explanation: `No specific travel policy restriction found for this item on the ${departureCountry} → ${destinationCountry} route. This does not confirm the item is exempt from inspection; general airline size, weight, and airport security limits still apply.`,
        conditions: 'Ensure item adheres to airline baggage dimensions and standard cabin safety rules.',
        baggageType: BAGGAGE_TYPES.BOTH,
        baggageLabel: 'Cabin & checked baggage',
        sourceName: 'International Passenger Baggage Standards (IATA / ICAO)',
        sourceUrl: 'https://www.iata.org/en/programs/passenger/',
        lastVerified: '2025-01-15',
        confidence: 'advisory',
        jurisdiction: 'General Aviation Guidelines',
        policyId: `generic-${group.itemType}`
      });
    }
  }

  // Sort results by severity: Prohibited -> Restricted -> Needs Verification -> No Rule Found
  const severityOrder = {
    [TRAVEL_STATUS.PROHIBITED]: 0,
    [TRAVEL_STATUS.RESTRICTED]: 1,
    [TRAVEL_STATUS.NEEDS_VERIFICATION]: 2,
    [TRAVEL_STATUS.NO_RULE_FOUND]: 3
  };

  results.sort((a, b) => (severityOrder[a.status] ?? 9) - (severityOrder[b.status] ?? 9));

  return {
    isValid: true,
    error: null,
    journey: {
      departureCountry,
      destinationCountry,
      destinationCity
    },
    checkedAt: new Date().toISOString(),
    summary: {
      totalItemsCount: items.length,
      uniqueItemTypesCount: groupedItems.size,
      flaggedCount: prohibitedCount + restrictedCount + needsVerificationCount,
      prohibitedCount,
      restrictedCount,
      needsVerificationCount,
      noRuleFoundCount
    },
    results
  };
}

export default evaluateRestrictions;
