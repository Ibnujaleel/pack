import React, { useState } from 'react';
import { Package, Plus, Search, Trash2, X, Camera } from 'lucide-react';
import catalogData from '../data/items_catalog.json';
import ItemIcon from './ItemIcon';

const CATALOG_VISIBLE_TYPES = [
  'sneakers',
  'hardcover_book',
  'rolled_tshirt',
  'folded_denim',
  'laptop_15',
  'tsa_liquid_pouch',
  'smartphone',
  'small_diary',
  'small_towel',
  'snack_bar',
  'wallet',
];

export default function Sidebar({ items = [], onAddItem, onRemoveItem, onClearItems, onOpenScanner }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter catalog items by search query and available catalog types
  const filteredCatalog = catalogData
    .filter((item) => CATALOG_VISIBLE_TYPES.includes(item.type))
    .filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col space-y-4 select-none">
      {/* 1. Selected Items Section */}
      <div className="bg-[#0e1322] border border-[#1b2337] rounded-2xl p-4 flex flex-col shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#182033]">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold tracking-wide text-white">Items</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#182238] text-slate-300 font-mono">
              {items.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClearItems}
            disabled={items.length === 0}
            className={`text-xs transition-colors ${
              items.length > 0
                ? 'text-rose-400 hover:text-rose-300 cursor-pointer font-medium'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            Clear All
          </button>
        </div>

        {/* Items List or Empty State */}
        {items.length === 0 ? (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#141b2e] border border-[#202c46] flex items-center justify-center text-slate-500 mb-3 shadow-inner">
              <Package className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-medium text-slate-200">No items added yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px] leading-relaxed">
              Add items from the catalog below to populate your suitcase packing list.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#121829] border border-[#1e273e] hover:border-[#2a3754] transition-all group"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <ItemIcon type={item.type} color={item.color} className="w-5 h-5" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono px-1 py-0.2 rounded bg-[#182136] shrink-0">
                        #{item.id}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">
                        {item.dimensions[0]}×{item.dimensions[1]}×{item.dimensions[2]} cm
                      </span>
                      <span>•</span>
                      <span>{item.weight.toFixed(2)} kg</span>
                    </div>
                  </div>
                </div>

                {/* Right: Tier Badge & Remove Button */}
                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      item.tier === 1
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                        : item.tier === 2
                        ? 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                        : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                    }`}
                  >
                    T{item.tier}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    title={`Remove ${item.name} (${item.id})`}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scan Items Action Button */}
      {onOpenScanner && (
        <button
          type="button"
          onClick={onOpenScanner}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/25 to-blue-600/20 hover:from-blue-600/30 hover:to-indigo-600/35 border border-blue-500/40 hover:border-blue-500/60 text-blue-200 hover:text-white text-xs font-semibold shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4 text-blue-400" />
          <span>Scan Items from Photo</span>
        </button>
      )}

      {/* 2. Catalog Section */}
      <div className="bg-[#0e1322] border border-[#1b2337] rounded-2xl p-4 flex flex-col shadow-xl flex-1">
        <div className="flex items-center justify-between pb-3 border-b border-[#182033]">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold tracking-wide text-white">Catalog</h2>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/50">
              6 items
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Standard items</span>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3 mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog items..."
            className="w-full bg-[#121829] border border-[#1e273d] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Catalog Items List */}
        <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
          {filteredCatalog.map((catalogItem) => (
            <div
              key={catalogItem.type}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#121829]/70 border border-[#1b253b] hover:border-[#283856] hover:bg-[#131b2e] transition-all group"
            >
              {/* Item Info */}
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
                  style={{ backgroundColor: `${catalogItem.color}20` }}
                >
                  <ItemIcon type={catalogItem.type} color={catalogItem.color} className="w-5 h-5" />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {catalogItem.name}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1 py-0.2 rounded border ${
                        catalogItem.tier === 1
                          ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                          : catalogItem.tier === 2
                          ? 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                          : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                      }`}
                    >
                      Tier {catalogItem.tier}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1.5 font-mono">
                    <span>
                      {catalogItem.dimensions[0]}×{catalogItem.dimensions[1]}×{catalogItem.dimensions[2]} cm
                    </span>
                    <span>•</span>
                    <span>{catalogItem.weight.toFixed(2)} kg</span>
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={() => onAddItem(catalogItem)}
                title={`Add ${catalogItem.name}`}
                className="w-7 h-7 rounded-lg bg-[#192338] border border-[#23314f] text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 flex items-center justify-center transition-all shadow-sm shrink-0 ml-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filteredCatalog.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              No matching items found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
