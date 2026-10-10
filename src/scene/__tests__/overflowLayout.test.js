import { describe, it, expect } from 'vitest';
import {
  getOverflowPosition,
  getOverflowAreaBounds,
  getOptimalCameraFraming
} from '../overflowLayout';

describe('Overflow Layout Module', () => {
  it('returns valid coordinates beside the suitcase (X > 0.25) for 1 item', () => {
    const pos = getOverflowPosition(0, 1, [20, 28, 12]);
    expect(pos[0]).toBeGreaterThan(0.25); // Strictly beside suitcase (+X)
    expect(pos[1]).toBeGreaterThan(0);    // Above floor
    expect(pos[2]).toBeCloseTo(0, 1);     // Centered along Z
  });

  it('arranges multiple items without overlapping positions', () => {
    const total = 4;
    const positions = [];
    for (let i = 0; i < total; i++) {
      positions.push(getOverflowPosition(i, total, [15, 10, 5]));
    }

    // Check that every position is distinct with minimum spacing
    for (let i = 0; i < total; i++) {
      for (let j = i + 1; j < total; j++) {
        const dx = positions[i][0] - positions[j][0];
        const dz = positions[i][2] - positions[j][2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        expect(distance).toBeGreaterThan(0.10); // At least 10cm spacing
      }
    }
  });

  it('keeps all overflow items to the right side of the suitcase (+X > 0.25)', () => {
    for (let total = 1; total <= 6; total++) {
      for (let i = 0; i < total; i++) {
        const [x] = getOverflowPosition(i, total, [10, 10, 10]);
        expect(x).toBeGreaterThan(0.25);
      }
    }
  });

  it('calculates bounding box covering all overflow items', () => {
    const bounds1 = getOverflowAreaBounds(1);
    expect(bounds1.center[0]).toBeGreaterThan(0.25);
    expect(bounds1.size[0]).toBeGreaterThan(0.15);
    expect(bounds1.size[1]).toBeGreaterThan(0.15);

    const bounds4 = getOverflowAreaBounds(4);
    expect(bounds4.columns).toBe(2);
    expect(bounds4.size[0]).toBeGreaterThan(bounds1.size[0]);
  });

  it('adjusts camera framing when overflow items are present', () => {
    const noOverflowFraming = getOptimalCameraFraming(0);
    expect(noOverflowFraming.target[0]).toBe(0);

    const withOverflowFraming = getOptimalCameraFraming(3);
    // Camera target and position shift slightly along +X to frame both suitcase and overflow area
    expect(withOverflowFraming.target[0]).toBeGreaterThan(0);
    expect(withOverflowFraming.position[0]).toBeGreaterThan(noOverflowFraming.position[0]);
  });
});
