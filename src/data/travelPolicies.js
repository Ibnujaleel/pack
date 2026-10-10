/**
 * Travel Restrictions Policy Database for StowAway 3D.
 * 
 * Complies with Phase 9 requirements:
 * - Structured schema supporting item type/category, route, baggage type, status,
 *   explanation, conditions, source URLs, verification dates, and confidence.
 * - Explicit statuses: 'prohibited', 'restricted', 'needs_verification', 'no_rule_found'.
 * - Real, authentic aviation and customs authorities:
 *   UK Civil Aviation Authority (CAA), GOV.UK (Border Force / HMRC / DEFRA),
 *   UAE General Civil Aviation Authority (GCAA), ICAO, and IATA.
 */

export const TRAVEL_STATUS = {
  PROHIBITED: 'prohibited',
  RESTRICTED: 'restricted',
  NEEDS_VERIFICATION: 'needs_verification',
  NO_RULE_FOUND: 'no_rule_found'
};

export const STATUS_LABELS = {
  [TRAVEL_STATUS.PROHIBITED]: 'Prohibited',
  [TRAVEL_STATUS.RESTRICTED]: 'Restricted / conditions apply',
  [TRAVEL_STATUS.NEEDS_VERIFICATION]: 'Needs verification',
  [TRAVEL_STATUS.NO_RULE_FOUND]: 'No specific rule found'
};

export const BAGGAGE_TYPES = {
  CARRY_ON: 'carry_on',
  CHECKED: 'checked',
  BOTH: 'both'
};

export const BAGGAGE_LABELS = {
  [BAGGAGE_TYPES.CARRY_ON]: 'Carry-on baggage',
  [BAGGAGE_TYPES.CHECKED]: 'Checked baggage',
  [BAGGAGE_TYPES.BOTH]: 'Cabin & checked baggage'
};

/**
 * Verified travel policies catalogue.
 * null for departureCountry or destinationCountry means the rule applies universally (international standard).
 */
export const TRAVEL_POLICIES = [
  // 1. Liquids (TSA Pouch / Liquids) - UAE to UK / International Cabin
  {
    id: 'pol-liquid-cabin-global',
    categoryOrType: ['tsa_liquid_pouch', 'liquid'],
    departureCountry: null,
    destinationCountry: 'United Kingdom',
    destinationCity: null,
    jurisdiction: 'UK Civil Aviation Authority (CAA) & International Civil Aviation Organization (ICAO)',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Liquids, Aerosols, and Gels (LAGs) Cabin Limit',
    explanation: 'Strict volume and container restrictions apply for carry-on liquids on flights entering the UK and departing international airports.',
    conditions: 'Containers must be 100ml (3.4 oz) or less and fit comfortably inside a single transparent, resealable 1-litre plastic bag (approx. 20cm × 20cm). Must be presented separately at security checkpoints unless advanced computed tomography (CT) scanners are in use at that terminal.',
    baggageType: BAGGAGE_TYPES.CARRY_ON,
    sourceName: 'UK Civil Aviation Authority (CAA) - Hand Luggage Restrictions',
    sourceUrl: 'https://www.gov.uk/hand-luggage-restrictions/liquids-and-laptops',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },
  {
    id: 'pol-liquid-checked-global',
    categoryOrType: ['tsa_liquid_pouch', 'liquid'],
    departureCountry: null,
    destinationCountry: 'United Kingdom',
    destinationCity: null,
    jurisdiction: 'UK CAA & ICAO',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Toiletry Liquids in Checked Baggage',
    explanation: 'Non-radioactive medicinal and toiletry articles (such as shampoos, lotions, perfumes) are permitted in checked baggage without the 100ml limit, subject to total dangerous goods limits.',
    conditions: 'Net quantity of each individual container must not exceed 0.5 kg or 0.5 L. Total aggregate quantity per passenger must not exceed 2.0 kg or 2.0 L. Containers must have secure caps to prevent accidental release during flight.',
    baggageType: BAGGAGE_TYPES.CHECKED,
    sourceName: 'UK Civil Aviation Authority - Items Allowed in Baggage',
    sourceUrl: 'https://www.caa.co.uk/passengers/before-you-fly/baggage/items-that-are-allowed-in-baggage/',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },

  // 2. Laptops & Portable Electronics with Lithium-ion Batteries
  {
    id: 'pol-laptop-uae-uk',
    categoryOrType: ['laptop_15'],
    departureCountry: 'United Arab Emirates',
    destinationCountry: 'United Kingdom',
    destinationCity: 'London',
    jurisdiction: 'UK CAA, UAE GCAA & IATA Dangerous Goods Regulations',
    status: TRAVEL_STATUS.RESTRICTED,
    title: '15-inch Laptop (Lithium-ion Battery PED)',
    explanation: 'Laptops contain lithium-ion rechargeable batteries (< 100Wh). Permitted in cabin baggage. In checked baggage, strict safety precautions apply.',
    conditions: 'Carry-on: Strongly recommended in cabin. Security screening officers at UAE and UK airports may require you to power on the device to prove functionality. Checked baggage: Permitted ONLY if completely turned off (not in sleep or hibernation mode) and protected against accidental activation or physical damage.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'UK Civil Aviation Authority - Lithium Batteries Guidance',
    sourceUrl: 'https://www.caa.co.uk/passengers/before-you-fly/baggage/banned-and-restricted-items/',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },
  {
    id: 'pol-laptop-general',
    categoryOrType: ['laptop_15'],
    departureCountry: null,
    destinationCountry: null,
    destinationCity: null,
    jurisdiction: 'ICAO Technical Instructions / IATA Dangerous Goods',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Laptop Computer (Portable Electronic Device)',
    explanation: 'Laptops with batteries under 100Wh are permitted in carry-on and conditionally in checked baggage under international aviation rules.',
    conditions: 'Carry-on recommended. If placed in checked baggage, must be powered off completely and packed securely to prevent short circuits or crushing.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'IATA Dangerous Goods Passenger Provisions Table 2.3.A',
    sourceUrl: 'https://www.iata.org/en/programs/cargo/dgr/',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },

  // 3. Smartphones & Cellphones (Lithium Battery PED)
  {
    id: 'pol-phone-uae-uk',
    categoryOrType: ['smartphone', 'cell_phone'],
    departureCountry: 'United Arab Emirates',
    destinationCountry: 'United Kingdom',
    destinationCity: null,
    jurisdiction: 'UAE GCAA & UK CAA Aviation Security',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Smartphone / Cell Phone (Lithium Battery Device)',
    explanation: 'Personal mobile phones are permitted in carry-on baggage. Devices must be charged to allow verification if requested at border or departure security.',
    conditions: 'Carry-on permitted. If placed in checked baggage, must be completely switched off (not in standby mode). Note: Spare power banks must NEVER be placed in checked luggage.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'UAE General Civil Aviation Authority (GCAA) Passenger Security',
    sourceUrl: 'https://www.gcaa.gov.ae/en/epublication/admin/drd/dangerous%20goods.pdf',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },
  {
    id: 'pol-phone-general',
    categoryOrType: ['smartphone', 'cell_phone'],
    departureCountry: null,
    destinationCountry: null,
    destinationCity: null,
    jurisdiction: 'ICAO / IATA Security Rules',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Mobile Phone / Smartphone',
    explanation: 'Permitted in cabin baggage. If checked, must be fully turned off.',
    conditions: 'Must be in working order and charged. Keep in cabin baggage for safety.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'IATA Passenger Provisions',
    sourceUrl: 'https://www.iata.org/en/programs/cargo/dgr/',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },

  // 4. Food & Agriculture - Snack Bar (UAE -> UK)
  {
    id: 'pol-food-uae-uk',
    categoryOrType: ['snack_bar', 'food'],
    departureCountry: 'United Arab Emirates',
    destinationCountry: 'United Kingdom',
    destinationCity: null,
    jurisdiction: 'UK Border Force & Department for Environment, Food & Rural Affairs (DEFRA)',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Personal Food Imports from Non-EU Countries (UAE → UK)',
    explanation: 'The UK strictly regulates food brought in by travelers arriving from non-EU countries to prevent animal disease outbreaks.',
    conditions: 'Meat, meat products, milk, and dairy products are strictly PROHIBITED from non-EU countries without commercial health certification. Commercially packaged snack bars, confectionery, and dry baked goods containing no meat or dairy ingredients are permitted for personal consumption. If your snack contains dairy or unverified ingredients, it may be confiscated at UK customs.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'GOV.UK - Bringing Food into Great Britain for Personal Use',
    sourceUrl: 'https://www.gov.uk/bringing-food-into-great-britain',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },
  {
    id: 'pol-food-australia',
    categoryOrType: ['snack_bar', 'food'],
    departureCountry: null,
    destinationCountry: 'Australia',
    destinationCity: null,
    jurisdiction: 'Australian Department of Agriculture, Fisheries and Forestry (DAFF) & ABF',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Biosecurity Food Declaration for Australia',
    explanation: 'Australia enforces world-leading biosecurity controls. ALL food items must be declared on your Incoming Passenger Card upon arrival.',
    conditions: 'You MUST declare any snack bars, nuts, seeds, or food items. Packaged commercial snacks may be inspected and cleared, but failure to declare carries severe fines up to AUD $6,260 or visa cancellation.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'Australian Border Force - Bringing Food into Australia',
    sourceUrl: 'https://www.abf.gov.au/entering-and-leaving-australia/can-i-bring-it-in/categories/food',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },
  {
    id: 'pol-food-us',
    categoryOrType: ['snack_bar', 'food'],
    departureCountry: null,
    destinationCountry: 'United States',
    destinationCity: null,
    jurisdiction: 'US Customs and Border Protection (CBP) & USDA APHIS',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Food Declaration for Entry into the United States',
    explanation: 'All food must be declared upon arrival at US Customs and Border Protection.',
    conditions: 'Commercially packaged dry snack bars and baked goods are generally allowed. Any snack items containing meat, poultry, or fresh agricultural ingredients are strictly prohibited and subject to civil penalties if undeclared.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'US Customs and Border Protection (CBP) - Prohibited Agricultural Items',
    sourceUrl: 'https://www.cbp.gov/travel/international-visitors/agricultural-items',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },

  // 5. Wallet & Cash Declarations - UAE to UK
  {
    id: 'pol-wallet-cash-uae-uk',
    categoryOrType: ['wallet'],
    departureCountry: 'United Arab Emirates',
    destinationCountry: 'United Kingdom',
    destinationCity: null,
    jurisdiction: 'HM Revenue & Customs (HMRC) & UK Border Force',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'Cash and High-Value Currency Declaration (£10,000+)',
    explanation: 'Currency declaration requirement for travelers arriving in Great Britain from non-EU jurisdictions.',
    conditions: 'If carrying £10,000 or more (or foreign currency equivalent) in cash, banker drafts, or bearer cheques inside your wallet or luggage, you MUST declare it online or at UK customs at least 72 hours before arrival or at the port of entry.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'GOV.UK - Take Cash In and Out of the UK',
    sourceUrl: 'https://www.gov.uk/bringing-cash-into-uk',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },
  {
    id: 'pol-wallet-cash-us',
    categoryOrType: ['wallet'],
    departureCountry: null,
    destinationCountry: 'United States',
    destinationCity: null,
    jurisdiction: 'Financial Crimes Enforcement Network (FinCEN) & US CBP',
    status: TRAVEL_STATUS.RESTRICTED,
    title: 'US Currency Reporting ($10,000+ USD)',
    explanation: 'Travelers carrying over $10,000 in currency or negotiable monetary instruments must file FinCEN Form 105 with US CBP.',
    conditions: 'No limit on the amount you can bring, but amounts exceeding $10,000 USD (or foreign equivalent) must be declared. Wallets with standard personal spending cash below this threshold require no action.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'US Customs and Border Protection - Money and Other Monetary Instruments',
    sourceUrl: 'https://www.cbp.gov/travel/international-visitors/kbyg/money',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },

  // 6. Common Prohibited and Dangerous Items (for reference and catalog matching)
  {
    id: 'pol-powerbank-checked',
    categoryOrType: ['power_bank', 'powerbank'],
    departureCountry: null,
    destinationCountry: null,
    destinationCity: null,
    jurisdiction: 'ICAO / IATA Dangerous Goods Regulations & All Aviation Authorities',
    status: TRAVEL_STATUS.PROHIBITED,
    title: 'Spare Lithium Battery / Power Bank in Checked Baggage',
    explanation: 'Spare lithium-ion batteries and power banks pose severe thermal runaway fire risks in aircraft cargo holds.',
    conditions: 'Strictly PROHIBITED in checked luggage on all commercial passenger flights worldwide. Must be carried exclusively in cabin (carry-on) baggage with terminal protection, rated under 100Wh (or 100-160Wh with airline approval).',
    baggageType: BAGGAGE_TYPES.CHECKED,
    sourceName: 'ICAO Technical Instructions for the Safe Transport of Dangerous Goods by Air',
    sourceUrl: 'https://www.icao.int/safety/dangerousgoods/',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },

  // 7. Non-battery accessories (chargers, cables)
  {
    id: 'pol-accessories-general',
    categoryOrType: ['phone_charger', 'charging_cable'],
    departureCountry: null,
    destinationCountry: null,
    destinationCity: null,
    jurisdiction: 'ICAO / Global Civil Aviation Authorities',
    status: TRAVEL_STATUS.NO_RULE_FOUND,
    title: 'Standard Charging Cables and Wall Adapters',
    explanation: 'No specific travel restrictions found for cables and wall power adapters. This does not confirm the item is exempt from inspection; standard airport screening rules apply.',
    conditions: 'Permitted in both carry-on and checked luggage. Subject to standard passenger screening.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'UK CAA / TSA Passenger Guidance',
    sourceUrl: 'https://www.gov.uk/hand-luggage-restrictions',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },

  // 8. Personal Apparel & Footwear (Sneakers, Jeans, T-Shirts, Towels)
  {
    id: 'pol-apparel-general',
    categoryOrType: ['sneakers', 'rolled_tshirt', 'folded_denim', 'small_towel'],
    departureCountry: null,
    destinationCountry: null,
    destinationCity: null,
    jurisdiction: 'Global Aviation & Customs',
    status: TRAVEL_STATUS.NO_RULE_FOUND,
    title: 'Personal Clothing and Footwear',
    explanation: 'No specific travel restrictions found for standard personal apparel and footwear. This does not confirm the item is exempt from inspection; standard airline baggage size and weight allowances apply.',
    conditions: 'Must comply with standard airline baggage size and weight allowances.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'IATA Passenger Baggage Standards',
    sourceUrl: 'https://www.iata.org/en/programs/passenger/',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  },

  // 9. Paper Goods & Printed Material (Books, Diaries)
  {
    id: 'pol-paper-general',
    categoryOrType: ['hardcover_book', 'small_diary'],
    departureCountry: null,
    destinationCountry: null,
    destinationCity: null,
    jurisdiction: 'Global Aviation & Customs',
    status: TRAVEL_STATUS.NO_RULE_FOUND,
    title: 'Books, Journals, and Printed Material',
    explanation: 'No specific travel restrictions found for personal books and notebooks. This does not confirm the item is exempt from inspection; standard airline baggage limits apply.',
    conditions: 'Permitted in cabin and checked luggage for personal reading and notes.',
    baggageType: BAGGAGE_TYPES.BOTH,
    sourceName: 'UK CAA & ICAO Passenger Baggage Guidelines',
    sourceUrl: 'https://www.gov.uk/hand-luggage-restrictions',
    lastVerified: '2025-01-15',
    confidence: 'verified'
  }
];

export default TRAVEL_POLICIES;
