import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { detectItems, MIN_CONFIDENCE } from './detectItems.js';
import { normalizeDetections } from './normalizeDetections.js';
import { buildRequest, ItemIdTracker, formatTypePrefix } from './buildRequest.js';
import catalog from '../data/items_catalog.json';
import './VisionLab.css';

/** Map of catalog items by type for quick lookup */
const CATALOG_MAP = Object.fromEntries(catalog.map((item) => [item.type, item]));

/** Visual icons for catalog items */
const ITEM_ICONS = {
  sneakers: '👟',
  hardcover_book: '📚',
  rolled_tshirt: '👕',
  folded_denim: '👖',
  laptop_15: '💻',
  tsa_liquid_pouch: '🧴',
};

/**
 * Thumbnail canvas component to render a cropped bounding box from the loaded image.
 */
function CropThumbnail({ imageSrc, bbox, fallbackIcon = '📦' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!imageSrc || !bbox || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const [bx, by, bw, bh] = bbox;
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (bw > 0 && bh > 0) {
        ctx.drawImage(img, bx, by, bw, bh, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = imageSrc;
  }, [imageSrc, bbox]);

  if (!imageSrc || !bbox) {
    return <span className="vl-crop-fallback" aria-hidden="true">{fallbackIcon}</span>;
  }

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={48}
      className="vl-crop-canvas"
      title={`Crop bbox [${bbox.map((v) => Math.round(v)).join(', ')}]`}
    />
  );
}

/**
 * VisionLab — Standalone test bench for detection & request payload generation.
 */
export default function VisionLab() {
  const [imageSrc, setImageSrc] = useState(null);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);

  // Phase 2 review state
  const [reviewItems, setReviewItems] = useState([]);
  const [selectedManualType, setSelectedManualType] = useState(catalog[0]?.type || 'sneakers');
  const [builtRequestJson, setBuiltRequestJson] = useState(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Stable ID tracker instance across user interactions in the session
  const idTrackerRef = useRef(new ItemIdTracker());
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  /* ── File picker ────────────────────────────────────── */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDetections([]);
    setError(null);
    setHasRun(false);

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.onerror = () => setError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  }, []);

  /* ── Draw bounding boxes ────────────────────────────── */
  const drawBoxes = useCallback((results) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    results.forEach((det, idx) => {
      const [x, y, w, h] = det.bbox;
      const colors = ['#00e5ff', '#ff6d00', '#76ff03', '#d500f9', '#ffea00', '#ff1744'];
      const color = colors[idx % colors.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, Math.round(canvas.width / 300));
      ctx.strokeRect(x, y, w, h);

      const label = `${det.class} ${(det.score * 100).toFixed(1)}%`;
      ctx.font = `bold ${Math.max(14, Math.round(canvas.width / 50))}px Inter, system-ui, sans-serif`;
      const metrics = ctx.measureText(label);
      const labelH = Math.max(18, Math.round(canvas.width / 40));
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y - labelH - 2, metrics.width + 10, labelH + 4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 5, y - 5);
    });
  }, []);

  /* ── Run detection ──────────────────────────────────── */
  const handleDetect = useCallback(async () => {
    const img = imgRef.current;
    if (!img) {
      setError('Upload an image first.');
      return;
    }

    setLoading(true);
    setError(null);
    setDetections([]);
    setHasRun(false);

    try {
      const results = await detectItems(img);
      setDetections(results);
      setHasRun(true);
      drawBoxes(results);

      // Convert raw detections to normalized suggestions
      const suggestions = normalizeDetections(results);

      // Create review items for Phase 2
      const newItems = suggestions.map((sug) => {
        const isHigh = sug.matchConfidence === 'high';
        // For high confidence: preselected in dropdown
        // For low confidence: suggest the type but user must confirm
        // For none: no type selected
        const initialType = sug.suggestedType || '';
        const id = initialType ? idTrackerRef.current.nextId(initialType) : '';

        return {
          id,
          key: `det-${sug.suggestionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          suggestionId: sug.suggestionId,
          detectedClass: sug.detectedClass,
          score: sug.score,
          bbox: sug.bbox,
          selectedType: initialType,
          matchConfidence: sug.matchConfidence,
          confirmed: isHigh, // high confidence is preselected; low or none needs confirmation
          origin: 'detection',
        };
      });

      // Preserve any existing manual items while replacing detection suggestions
      setReviewItems((prev) => [
        ...prev.filter((item) => item.origin === 'manual'),
        ...newItems,
      ]);

      if (results.length === 0) {
        setError(
          `No objects detected with confidence ≥ ${(MIN_CONFIDENCE * 100).toFixed(0)}%. ` +
          `Try a photo with common objects (laptop, book, bottle, etc.) or add items manually below.`
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [drawBoxes]);

  /* ── Manual item addition ───────────────────────────── */
  const handleAddManualItem = useCallback(() => {
    if (!selectedManualType) return;
    const newId = idTrackerRef.current.nextId(selectedManualType);

    setReviewItems((prev) => [
      ...prev,
      {
        id: newId,
        key: `man-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        suggestionId: null,
        detectedClass: 'Manual Entry',
        score: null,
        bbox: null,
        selectedType: selectedManualType,
        matchConfidence: 'high',
        confirmed: true,
        origin: 'manual',
      },
    ]);
  }, [selectedManualType]);

  /* ── Change an item's catalog type ──────────────────── */
  const handleTypeChange = useCallback((itemKey, newType) => {
    setReviewItems((prev) =>
      prev.map((item) => {
        if (item.key !== itemKey) return item;

        let updatedId = item.id;
        if (!newType) {
          updatedId = '';
        } else if (!item.id || formatTypePrefix(item.selectedType) !== formatTypePrefix(newType)) {
          // Type prefix changed: generate stable ID for new type
          updatedId = idTrackerRef.current.nextId(newType);
        }

        return {
          ...item,
          selectedType: newType,
          id: updatedId,
          // Once user explicitly picks a type from the dropdown, mark as confirmed
          confirmed: Boolean(newType),
          matchConfidence: newType ? 'high' : 'none',
        };
      })
    );
  }, []);

  /* ── Confirm a low-confidence item ──────────────────── */
  const handleConfirmItem = useCallback((itemKey) => {
    setReviewItems((prev) =>
      prev.map((item) => {
        if (item.key !== itemKey) return item;
        let id = item.id;
        if (!id && item.selectedType) {
          id = idTrackerRef.current.nextId(item.selectedType);
        }
        return {
          ...item,
          confirmed: true,
          id,
        };
      })
    );
  }, []);

  /* ── Remove an item from the review list ────────────── */
  const handleRemoveItem = useCallback((itemKey) => {
    setReviewItems((prev) => prev.filter((item) => item.key !== itemKey));
  }, []);

  /* ── Running total weight computation ───────────────── */
  const runningTotalWeight = useMemo(() => {
    return reviewItems.reduce((sum, item) => {
      if (!item.selectedType) return sum;
      const cat = CATALOG_MAP[item.selectedType];
      return sum + (cat ? cat.weight : 0);
    }, 0);
  }, [reviewItems]);

  /* ── Build request JSON ─────────────────────────────── */
  const handleBuildRequest = useCallback(() => {
    // Pass items array to pure buildRequest
    const requestPayload = buildRequest(
      reviewItems.map((item) => ({
        id: item.id,
        type: item.selectedType,
        overrides: {},
      })),
      idTrackerRef.current
    );

    const jsonString = JSON.stringify(requestPayload, null, 2);
    setBuiltRequestJson(jsonString);
    setSkippedCount(requestPayload.skipped ? requestPayload.skipped.length : 0);
    setCopied(false);
  }, [reviewItems]);

  /* ── Copy to clipboard ──────────────────────────────── */
  const handleCopyJson = useCallback(async () => {
    if (!builtRequestJson) return;
    try {
      await navigator.clipboard.writeText(builtRequestJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [builtRequestJson]);

  /* ── Download request.json ──────────────────────────── */
  const handleDownloadJson = useCallback(() => {
    if (!builtRequestJson) return;
    const blob = new Blob([builtRequestJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'request.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [builtRequestJson]);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="vl-root">
      <header className="vl-header">
        <h1 className="vl-title">
          <span className="vl-title-icon">🔬</span> Vision Lab
          <span className="vl-badge">Phase 2</span>
        </h1>
        <p className="vl-subtitle">
          Detection pipeline &amp; engine request builder&nbsp;·&nbsp;StowAway 3D
        </p>
      </header>

      {/* ── Detection Controls ────────────────────────── */}
      <section className="vl-controls" aria-label="Detection controls">
        <label className="vl-upload-label" htmlFor="vl-file-input">
          <span className="vl-upload-icon">📁</span>
          Choose Image
          <input
            id="vl-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="vl-file-input"
          />
        </label>

        <button
          id="vl-detect-btn"
          className="vl-detect-btn"
          onClick={handleDetect}
          disabled={!imageSrc || loading}
        >
          {loading ? (
            <>
              <span className="vl-spinner" aria-hidden="true" /> Loading model…
            </>
          ) : (
            '🎯 Detect'
          )}
        </button>
      </section>

      {/* ── Error / info banner ───────────────────────── */}
      {error && (
        <div className="vl-error" role="alert">
          <span className="vl-error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Image preview + overlay ───────────────────── */}
      {imageSrc && (
        <section className="vl-preview-section" aria-label="Image preview">
          <div className="vl-preview-wrapper">
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Uploaded preview"
              className="vl-preview-img"
              crossOrigin="anonymous"
            />
            <canvas ref={canvasRef} className="vl-overlay-canvas" />
          </div>
        </section>
      )}

      {/* ── Raw detections table ───────────────────────── */}
      {hasRun && detections.length > 0 && (
        <section className="vl-results-section" aria-label="Raw detections">
          <h2 className="vl-results-heading">
            Raw Detections
            <span className="vl-results-count">{detections.length}</span>
          </h2>
          <div className="vl-table-wrapper">
            <table className="vl-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Class</th>
                  <th>Score</th>
                  <th>Bbox (x, y, w, h)</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((det, i) => (
                  <tr key={i}>
                    <td className="vl-cell-num">{i + 1}</td>
                    <td className="vl-cell-class">{det.class}</td>
                    <td className="vl-cell-score">
                      <span className="vl-score-bar" style={{ '--pct': `${det.score * 100}%` }}>
                        {(det.score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="vl-cell-bbox">
                      [{det.bbox.map((v) => Math.round(v)).join(', ')}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── PHASE 2 REVIEW PANEL ──────────────────────── */}
      <section className="vl-review-section" aria-label="Item review panel">
        <div className="vl-review-header">
          <div className="vl-review-title-group">
            <h2 className="vl-results-heading">
              <span>📋 Item Review &amp; Catalog Matching</span>
              <span className="vl-results-count">{reviewItems.length}</span>
            </h2>
            <p className="vl-review-desc">
              Convert raw detections into canonical catalog items, correct suggestions, or add items manually without photos.
            </p>
          </div>

          <div className="vl-running-weight-card" aria-label="Total weight summary">
            <span className="vl-running-weight-label">Running Total Weight</span>
            <span className="vl-running-weight-value">
              {runningTotalWeight.toFixed(2)} <span className="vl-unit">kg</span>
            </span>
          </div>
        </div>

        {/* ── Manual Add Item Bar ─────────────────────── */}
        <div className="vl-manual-add-bar" aria-label="Manual item entry">
          <div className="vl-manual-select-group">
            <label htmlFor="vl-manual-select" className="vl-manual-label">
              Manual Item Entry (no photo needed):
            </label>
            <select
              id="vl-manual-select"
              className="vl-select vl-select-manual"
              value={selectedManualType}
              onChange={(e) => setSelectedManualType(e.target.value)}
            >
              {catalog.map((item) => (
                <option key={item.type} value={item.type}>
                  {ITEM_ICONS[item.type] || '📦'} {item.name} — Tier {item.tier} ({item.weight.toFixed(2)} kg)
                </option>
              ))}
            </select>
          </div>

          <button
            id="vl-add-manual-btn"
            className="vl-btn-secondary"
            onClick={handleAddManualItem}
            type="button"
          >
            ➕ Add Item
          </button>
        </div>

        {/* ── Review items table ──────────────────────── */}
        {reviewItems.length === 0 ? (
          <div className="vl-empty-state">
            <p className="vl-empty-text">
              No items in the review list yet. Detect objects in an image above or use <strong>Add Item</strong> to manually add catalog items.
            </p>
          </div>
        ) : (
          <div className="vl-table-wrapper">
            <table className="vl-table vl-review-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Detected Class</th>
                  <th>Score</th>
                  <th>Catalog Item Selection</th>
                  <th>Status</th>
                  <th>Catalog Specs</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewItems.map((item, idx) => {
                  const catItem = CATALOG_MAP[item.selectedType];
                  const needsConfirm =
                    !item.confirmed &&
                    (item.matchConfidence === 'low' || item.matchConfidence === 'none');

                  return (
                    <tr
                      key={item.key}
                      className={`vl-review-row ${needsConfirm ? 'vl-row-needs-confirm' : ''}`}
                    >
                      {/* Crop or Icon */}
                      <td className="vl-cell-crop">
                        <CropThumbnail
                          imageSrc={imageSrc}
                          bbox={item.bbox}
                          fallbackIcon={ITEM_ICONS[item.selectedType] || '🏷️'}
                        />
                      </td>

                      {/* Detected class */}
                      <td className="vl-cell-class">
                        <div className="vl-class-pill">
                          {item.origin === 'manual' ? '✍️ Manual' : item.detectedClass}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="vl-cell-score">
                        {item.score !== null ? (
                          <span
                            className="vl-score-bar"
                            style={{ '--pct': `${item.score * 100}%` }}
                          >
                            {(item.score * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="vl-manual-tag">Manual</span>
                        )}
                      </td>

                      {/* Catalog Dropdown */}
                      <td className="vl-cell-dropdown">
                        <select
                          id={`vl-select-${item.key}`}
                          className="vl-select"
                          value={item.selectedType || ''}
                          onChange={(e) => handleTypeChange(item.key, e.target.value)}
                        >
                          <option value="">Choose item...</option>
                          {catalog.map((cat) => (
                            <option key={cat.type} value={cat.type}>
                              {ITEM_ICONS[cat.type] || '📦'} {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status / Confirm Badge */}
                      <td className="vl-cell-status">
                        {needsConfirm ? (
                          <div className="vl-confirm-badge-wrap">
                            <span className="vl-badge-confirm" title="Needs user confirmation">
                              ⚠️ Please confirm
                            </span>
                            {item.selectedType && (
                              <button
                                type="button"
                                className="vl-btn-confirm-mini"
                                onClick={() => handleConfirmItem(item.key)}
                                title="Confirm this selection"
                              >
                                ✓ Confirm
                              </button>
                            )}
                          </div>
                        ) : item.selectedType ? (
                          <span className="vl-badge-ready">
                            {item.origin === 'manual' ? 'Added' : 'Ready'}
                          </span>
                        ) : (
                          <span className="vl-badge-skipped">No type</span>
                        )}
                      </td>

                      {/* Specs: name, tier, weight */}
                      <td className="vl-cell-specs">
                        {catItem ? (
                          <div className="vl-specs-content">
                            <div className="vl-spec-name">
                              <strong>{catItem.name}</strong>
                              {item.id && <code className="vl-item-id-pill">{item.id}</code>}
                            </div>
                            <div className="vl-spec-meta">
                              <span className="vl-meta-pill">Tier {catItem.tier}</span>
                              <span className="vl-meta-pill">{catItem.weight.toFixed(2)} kg</span>
                              <span className="vl-meta-dim">{catItem.dimensions.join('×')} cm</span>
                            </div>
                          </div>
                        ) : (
                          <span className="vl-unselected-note">Select an item</span>
                        )}
                      </td>

                      {/* Remove Button */}
                      <td className="vl-cell-remove">
                        <button
                          type="button"
                          id={`vl-remove-btn-${idx}`}
                          className="vl-btn-remove"
                          onClick={() => handleRemoveItem(item.key)}
                          title="Remove item"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Build Request JSON Action ────────────────── */}
        <div className="vl-request-actions">
          <button
            id="vl-build-request-btn"
            className="vl-btn-build"
            onClick={handleBuildRequest}
            type="button"
          >
            ⚙️ Build request JSON
          </button>
        </div>

        {/* ── Skipped Items Warning ────────────────────── */}
        {skippedCount > 0 && (
          <div className="vl-warning-banner" role="alert">
            <span className="vl-warning-icon">⚠️</span>
            <div>
              <strong>Warning:</strong> {skippedCount} item(s) excluded because no catalog type was selected.
              Unselected items are skipped from the engine request payload.
            </div>
          </div>
        )}

        {/* ── JSON Preview Box ─────────────────────────── */}
        {builtRequestJson && (
          <div className="vl-json-section" aria-label="Generated request JSON">
            <div className="vl-json-header">
              <span className="vl-json-title">Payload (exact engine format):</span>
              <div className="vl-json-btns">
                <button
                  id="vl-copy-json-btn"
                  className="vl-btn-small"
                  onClick={handleCopyJson}
                  type="button"
                >
                  {copied ? '✓ Copied!' : '📋 Copy JSON'}
                </button>
                <button
                  id="vl-download-json-btn"
                  className="vl-btn-small"
                  onClick={handleDownloadJson}
                  type="button"
                >
                  💾 Download request.json
                </button>
              </div>
            </div>

            <pre className="vl-json-pre">
              <code>{builtRequestJson}</code>
            </pre>
          </div>
        )}
      </section>

      <footer className="vl-footer">
        Confidence threshold: {(MIN_CONFIDENCE * 100).toFixed(0)}%&nbsp;·&nbsp;
        Model: COCO-SSD (TensorFlow.js)&nbsp;·&nbsp;Canonical catalog: {catalog.length} items
      </footer>
    </div>
  );
}
