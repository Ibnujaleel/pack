import { describe, it, expect } from 'vitest';
import { MIN_CONFIDENCE, LOW_SCORE_THRESHOLD, detectItems } from '../detectItems.js';

describe('detectItems', () => {
  it('exports MIN_CONFIDENCE as 0.35', () => {
    expect(MIN_CONFIDENCE).toBe(0.35);
  });

  it('exports LOW_SCORE_THRESHOLD as 0.5', () => {
    expect(LOW_SCORE_THRESHOLD).toBe(0.5);
  });

  it('throws a descriptive error when called without an image element', async () => {
    await expect(detectItems(null)).rejects.toThrow('detectItems: imageElement is required.');
  });
});
