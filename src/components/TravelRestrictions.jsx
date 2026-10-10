import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  Info,
  ExternalLink,
  Plane,
  MapPin,
  Trash2,
  ChevronDown,
  Search,
  X,
  Maximize2,
  Check
} from 'lucide-react';
import { TRAVEL_COUNTRIES } from '../data/travelCountries.js';
import { TRAVEL_STATUS } from '../data/travelPolicies.js';
import { evaluateRestrictions } from '../policy/evaluateRestrictions.js';

/**
 * Searchable country selector dropdown compatible with current dark theme.
 */
function SearchableCountrySelect({
  label,
  value,
  onChange,
  placeholder = 'Select country...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = TRAVEL_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="relative flex-1" ref={containerRef}>
      <label className="block text-[11px] font-medium text-slate-400 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#121829] border border-[#1e273d] hover:border-slate-600 focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-left text-slate-200 transition-colors shadow-inner"
      >
        <span className={value ? 'text-slate-200 font-medium truncate' : 'text-slate-500 truncate'}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-[#0e1424] border border-[#202c46] rounded-xl shadow-2xl z-40 overflow-hidden py-1">
          {/* Search filter input */}
          <div className="px-2 pb-1.5 pt-1 border-b border-[#182238] flex items-center space-x-1.5">
            <Search className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtered list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 text-center">
                No matching country
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = c.name === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.name);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 font-medium'
                        : 'text-slate-300 hover:bg-[#18233a]'
                    }`}
                  >
                    <span>{c.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Status badge with distinctive color coding per Phase 9 specifications.
 */
function StatusBadge({ status, label }) {
  if (status === TRAVEL_STATUS.PROHIBITED) {
    return (
      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/50 text-rose-300 shadow-sm">
        <ShieldAlert className="w-3 h-3" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === TRAVEL_STATUS.RESTRICTED) {
    return (
      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/50 text-amber-300 shadow-sm">
        <AlertTriangle className="w-3 h-3" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === TRAVEL_STATUS.NEEDS_VERIFICATION) {
    return (
      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-500/50 text-sky-300 shadow-sm">
        <HelpCircle className="w-3 h-3" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400">
      <Info className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
}

/**
 * Baggage type badge component.
 */
function BaggageTypeBadge({ label }) {
  return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#182338] text-slate-300 border border-[#22304d]">
      {label}
    </span>
  );
}

export default function TravelRestrictions({
  items = [],
  onRemoveItem,
  departureCountry,
  setDepartureCountry,
  destinationCountry,
  setDestinationCountry,
  destinationCity,
  setDestinationCity
}) {
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derive evaluation reactively whenever items, route or evaluated state changes
  const evaluation = useMemo(() => {
    if (!hasEvaluated || !departureCountry || !destinationCountry) return null;
    return evaluateRestrictions(items, {
      departureCountry,
      destinationCountry,
      destinationCity
    });
  }, [hasEvaluated, items, departureCountry, destinationCountry, destinationCity]);

  // Trigger evaluation
  const handleCheckRestrictions = () => {
    if (!departureCountry || !destinationCountry) return;
    setHasEvaluated(true);
  };

  const canCheck = Boolean(departureCountry && destinationCountry);

  // Quick preset loader for prompt test case: UAE -> UK (London)
  const handleLoadExample = () => {
    setDepartureCountry('United Arab Emirates');
    setDestinationCountry('United Kingdom');
    setDestinationCity('London');
  };

  const results = evaluation ? evaluation.results : [];
  const summary = evaluation ? evaluation.summary : null;

  return (
    <div className="bg-[#0e1322] border border-[#1b2337] rounded-2xl p-4 flex flex-col shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#182033]">
        <div className="flex items-center space-x-2">
          <Plane className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white">
            Travel Restrictions
          </h2>
        </div>

        {summary && summary.flaggedCount > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/50">
            {summary.flaggedCount} Flagged
          </span>
        )}
      </div>

      {/* Journey Form */}
      <div className="mt-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <SearchableCountrySelect
            label="Departure Country"
            value={departureCountry}
            onChange={setDepartureCountry}
            placeholder="Select departure..."
          />
          <SearchableCountrySelect
            label="Destination Country"
            value={destinationCountry}
            onChange={setDestinationCountry}
            placeholder="Select destination..."
          />
        </div>

        {/* Destination City (Optional) */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>Destination City (Optional)</span>
            </label>
            <input
              type="text"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              placeholder="e.g. London"
              className="w-full bg-[#121829] border border-[#1e273d] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Quick preset trigger */}
          <div className="pt-5">
            <button
              type="button"
              onClick={handleLoadExample}
              title="Fill example: UAE → UK (London)"
              className="text-[10px] font-medium text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/40 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              UAE → UK
            </button>
          </div>
        </div>

        {/* Check Restrictions Button */}
        <button
          type="button"
          onClick={handleCheckRestrictions}
          disabled={!canCheck}
          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            canCheck
              ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-600/20 active:scale-[0.98]'
              : 'bg-blue-600/25 border border-blue-500/20 text-blue-300/40 cursor-not-allowed shadow-inner'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{hasEvaluated ? 'Recheck Restrictions' : 'Check Restrictions'}</span>
        </button>
      </div>

      {/* Restrictions Results Panel */}
      {hasEvaluated && evaluation && (
        <div className="mt-4 pt-3 border-t border-[#182033] flex flex-col space-y-3">
          {/* Route Summary */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-[#121829] p-2 rounded-xl border border-[#1d263c]">
            <div className="truncate">
              <span className="font-semibold text-slate-200">{departureCountry}</span>
              <span className="mx-1 text-slate-500">→</span>
              <span className="font-semibold text-slate-200">
                {destinationCountry}
                {destinationCity ? ` (${destinationCity})` : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              title="Expand full restriction details"
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1b243b] transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Results List */}
          {items.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500">
              No items in your packing list. Add items from the catalog to evaluate restrictions.
            </div>
          ) : results.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500">
              No applicable items evaluated.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {results.map((itemResult) => (
                <div
                  key={itemResult.itemType}
                  className="p-2.5 rounded-xl bg-[#121829] border border-[#1e273e] hover:border-[#2a3754] transition-all flex flex-col space-y-2"
                >
                  {/* Top row: Item Name, Count, Badges, Remove Button */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {itemResult.name}
                      </span>
                      {itemResult.count > 1 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#182136] text-blue-300 font-semibold shrink-0">
                          ×{itemResult.count}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <StatusBadge
                        status={itemResult.status}
                        label={itemResult.statusLabel}
                      />
                      {onRemoveItem && itemResult.instanceIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            // Remove the last instance of this flagged item
                            const targetId = itemResult.instanceIds[itemResult.instanceIds.length - 1];
                            onRemoveItem(targetId);
                          }}
                          title={`Remove one ${itemResult.name} from suitcase`}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Baggage Type Scope */}
                  <div>
                    <BaggageTypeBadge label={itemResult.baggageLabel} />
                  </div>

                  {/* Short Clear Explanation */}
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {itemResult.explanation}
                  </p>

                  {/* Detailed Conditions (if any) */}
                  {itemResult.conditions && (
                    <div className="p-2 rounded-lg bg-[#0e1424] border border-[#1a2339] text-[10px] text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-300 mr-1">Rule:</span>
                      {itemResult.conditions}
                    </div>
                  )}

                  {/* Source Reference Link */}
                  {itemResult.sourceUrl && (
                    <div className="pt-0.5 flex items-center justify-between text-[10px] text-slate-500">
                      <a
                        href={itemResult.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors truncate max-w-[240px]"
                      >
                        <span className="truncate">{itemResult.sourceName}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                      </a>
                      {itemResult.lastVerified && (
                        <span className="shrink-0 text-slate-600">
                          {itemResult.lastVerified}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Legal Advisory Disclaimer */}
          <div className="pt-2 border-t border-[#182033] text-[10px] text-slate-500 italic leading-snug">
            Advisory only. Official civil aviation security and customs authorities have final inspection authority. Check airline rules before departing.
          </div>
        </div>
      )}

      {/* Expanded Full-Details Modal */}
      {isModalOpen && evaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e1322] border border-[#1e273e] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#182033] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plane className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">
                  Travel Restrictions Report: {departureCountry} → {destinationCountry}
                  {destinationCity ? ` (${destinationCity})` : ''}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#182238] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {results.map((itemResult) => (
                <div
                  key={itemResult.itemType}
                  className="p-3.5 rounded-xl bg-[#121829] border border-[#1e273e] flex flex-col space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white">
                        {itemResult.name}
                      </span>
                      {itemResult.count > 1 && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#182136] text-blue-300 font-semibold">
                          Total Quantity: {itemResult.count}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <BaggageTypeBadge label={itemResult.baggageLabel} />
                      <StatusBadge
                        status={itemResult.status}
                        label={itemResult.statusLabel}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {itemResult.explanation}
                  </p>

                  {itemResult.conditions && (
                    <div className="p-2.5 rounded-lg bg-[#0e1424] border border-[#1a2339] text-xs text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-200">Conditions & Limits: </span>
                      {itemResult.conditions}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-[#182033]">
                    <span>Authority: {itemResult.jurisdiction}</span>
                    <a
                      href={itemResult.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 underline"
                    >
                      <span>Official Source: {itemResult.sourceName}</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#0a0f1b] border-t border-[#182033] flex items-center justify-between text-xs text-slate-400">
              <span>Verified standards compiled from UK CAA, GCAA, IATA, and Border Force.</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
