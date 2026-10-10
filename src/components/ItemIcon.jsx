import React from 'react';
import { Book, Shirt, Laptop, Droplets, Layers } from 'lucide-react';

export default function ItemIcon({ type, color, className = "w-5 h-5" }) {
  // Custom sneaker icon SVG
  if (type === 'sneakers') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
        <path d="M3.5 15.5 8 15l3-3.5 4 .5 4 4.5h2.5c.6 0 1 .4 1 1s-.4 1-1 1H3a1 1 0 0 1-1-1c0-1 1-1.5 1.5-1.5Z" />
        <path d="m8 11.5 1-2.5 3 .5" />
        <path d="M11 9 12 7" />
        <path d="M13.5 9.5 15 8" />
        <circle cx="5" cy="17" r="1" fill="currentColor" />
        <circle cx="9" cy="17" r="1" fill="currentColor" />
        <circle cx="13" cy="17" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'hardcover_book') {
    return <Book className={className} style={{ color }} />;
  }

  if (type === 'rolled_tshirt') {
    return <Shirt className={className} style={{ color }} />;
  }

  if (type === 'folded_denim') {
    return <Layers className={className} style={{ color }} />;
  }

  if (type === 'laptop_15') {
    return <Laptop className={className} style={{ color }} />;
  }

  if (type === 'tsa_liquid_pouch') {
    return <Droplets className={className} style={{ color }} />;
  }

  return <Layers className={className} style={{ color }} />;
}
