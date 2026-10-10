import React, { useState, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Scene from './scene/Scene';
import PackControls from './components/PackControls';
import PackingStatus from './components/PackingStatus';
import SuitcaseDimensions from './components/SuitcaseDimensions';
import FooterStatus from './components/FooterStatus';

export default function App() {
  const [items, setItems] = useState([]);
  const idCounterRef = useRef({});

  // Add an item instance with a guaranteed unique instance ID
  const handleAddItem = (catalogItem) => {
    const currentCount = (idCounterRef.current[catalogItem.type] || 0) + 1;
    idCounterRef.current[catalogItem.type] = currentCount;

    const newInstance = {
      id: `${catalogItem.type}-${currentCount}`,
      type: catalogItem.type,
      name: catalogItem.name,
      dimensions: [...catalogItem.dimensions],
      weight: catalogItem.weight,
      tier: catalogItem.tier,
      elasticity: catalogItem.elasticity,
      geometry: catalogItem.geometry,
      color: catalogItem.color,
      animation: catalogItem.animation,
      tags: [...catalogItem.tags],
      overrides: {}
    };

    setItems((prev) => [...prev, newInstance]);
  };

  // Remove a specific instance by its unique ID
  const handleRemoveItem = (instanceId) => {
    setItems((prev) => prev.filter((item) => item.id !== instanceId));
  };

  // Clear all items from the packing list
  const handleClearItems = () => {
    setItems([]);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Dashboard Layout Area */}
      <main className="flex-1 p-3 sm:p-4 lg:p-5 flex flex-col gap-4 max-w-[1800px] w-full mx-auto">
        {/* Responsive Grid/Columns: Left (Items & Catalog), Center (3D Workspace), Right (Controls & Status) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Left Column: Functional Items List & Catalog */}
          <Sidebar
            items={items}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onClearItems={handleClearItems}
          />

          {/* Center Column: Interactive 3D Suitcase & Item Models Scene */}
          <Scene items={items} />

          {/* Right Column: Controls, Packing Status, Suitcase Dimensions */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4">
            <PackControls
              itemCount={items.length}
              onClearItems={handleClearItems}
            />
            <PackingStatus items={items} />
            <SuitcaseDimensions />
          </div>
        </div>

        {/* Bottom Status Area */}
        <FooterStatus items={items} />
      </main>
    </div>
  );
}
