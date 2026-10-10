import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  Minus,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
  VideoOff,
} from 'lucide-react';
import catalogData from '../data/items_catalog.json';
import ItemIcon from './ItemIcon';
import { validateImageFile } from '../scanner/validateImage.js';
import { detectItems } from '../scanner/detectItems.js';
import { normalizeDetections } from '../scanner/normalizeDetections.js';

export default function ItemScannerModal({ isOpen, onClose, onAddItems }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera'
  const [imageSrc, setImageSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);

  // Review list of detected items
  const [reviewItems, setReviewItems] = useState([]);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera stream refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Canvas / Image overlay refs
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  // Stop camera tracks helper
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Modal close handler
  const handleClose = useCallback(() => {
    stopCameraStream();
    setImageSrc(null);
    setReviewItems([]);
    setErrorMessage(null);
    setHasScanned(false);
    setIsSubmitting(false);
    onClose();
  }, [stopCameraStream, onClose]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Start camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError(err.message || 'Unable to access camera.');
      setCameraActive(false);
    }
  };

  // Switch between tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === 'camera') {
      startCamera();
    } else {
      stopCameraStream();
    }
  };

  // Capture photo from video stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCameraStream();
    setImageSrc(dataUrl);
    processImageSrc(dataUrl);
  };

  // Handle uploaded file
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target.result;
      setImageSrc(src);
      processImageSrc(src);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  // Run COCO-SSD detection on image
  const processImageSrc = (src) => {
    setIsProcessing(true);
    setProcessingStatus('Loading COCO-SSD detection model in browser...');
    setErrorMessage(null);
    setHasScanned(false);

    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    tempImg.onload = async () => {
      try {
        setProcessingStatus('Detecting items and analyzing bounding boxes...');
        const rawDetections = await detectItems(tempImg);
        const normalized = normalizeDetections(rawDetections);

        setIgnoredCount(normalized.ignored ? normalized.ignored.length : 0);

        const initialReviewItems = normalized.map((item) => ({
          id: item.suggestionId,
          detectedClass: item.detectedClass,
          score: item.score,
          bbox: item.bbox,
          selectedType: item.suggestedType || '',
          quantity: 1,
          included: Boolean(item.suggestedType),
          matchConfidence: item.matchConfidence,
        }));

        setReviewItems(initialReviewItems);
        setHasScanned(true);
      } catch (err) {
        setErrorMessage(err.message || 'Detection failed. Please check network/browser.');
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    };
    tempImg.onerror = () => {
      setErrorMessage('Could not load image for detection.');
      setIsProcessing(false);
      setProcessingStatus('');
    };
    tempImg.src = src;
  };

  // Draw bounding boxes on canvas overlay
  const drawBoundingBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;

    reviewItems.forEach((item) => {
      const [bx, by, bw, bh] = item.bbox;
      const x = bx * scaleX;
      const y = by * scaleY;
      const w = bw * scaleX;
      const h = bh * scaleY;

      const isIncluded = item.included && item.selectedType;
      const strokeColor = isIncluded ? '#10b981' : item.selectedType ? '#f59e0b' : '#64748b';
      const bgColor = isIncluded ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.08)';

      // Box fill and stroke
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(x, y, w, h);

      // Label Pill
      const scorePct = Math.round(item.score * 100);
      const labelText = `${item.detectedClass} (${scorePct}%)`;
      ctx.font = 'bold 11px sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      ctx.fillStyle = isIncluded ? '#047857' : '#334155';
      ctx.fillRect(x, Math.max(0, y - 18), textWidth + 8, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x + 4, Math.max(13, y - 5));
    });
  }, [reviewItems]);

  useEffect(() => {
    if (imageSrc && hasScanned) {
      drawBoundingBoxes();
      window.addEventListener('resize', drawBoundingBoxes);
      return () => window.removeEventListener('resize', drawBoundingBoxes);
    }
  }, [imageSrc, hasScanned, drawBoundingBoxes]);

  // Review List Item Modifications
  const toggleInclude = (id) => {
    setReviewItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, included: !it.included } : it))
    );
  };

  const handleTypeChange = (id, newType) => {
    setReviewItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, selectedType: newType, included: Boolean(newType) } : it
      )
    );
  };

  const handleQuantityChange = (id, delta) => {
    setReviewItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const newQty = Math.max(1, Math.min(10, it.quantity + delta));
        return { ...it, quantity: newQty };
      })
    );
  };

  const handleRemoveReviewItem = (id) => {
    setReviewItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddManualItem = () => {
    const newId = `manual-${Date.now()}`;
    const defaultCatalogItem = catalogData[0];
    setReviewItems((prev) => [
      ...prev,
      {
        id: newId,
        detectedClass: 'manual item',
        score: 1.0,
        bbox: [0, 0, 0, 0],
        selectedType: defaultCatalogItem?.type || 'sneakers',
        quantity: 1,
        included: true,
        matchConfidence: 'high',
      },
    ]);
  };

  // Calculate items ready to add
  const selectedToConfirm = reviewItems.filter((it) => it.included && it.selectedType);
  const totalItemCountToAdd = selectedToConfirm.reduce((sum, it) => sum + it.quantity, 0);

  // Confirm and batch-add items into packing list
  const handleConfirmAndAdd = () => {
    if (isSubmitting || totalItemCountToAdd === 0) return;
    setIsSubmitting(true);

    const itemsToAdd = [];
    selectedToConfirm.forEach((reviewItem) => {
      const catalogItem = catalogData.find((c) => c.type === reviewItem.selectedType);
      if (catalogItem) {
        for (let i = 0; i < reviewItem.quantity; i++) {
          itemsToAdd.push(catalogItem);
        }
      }
    });

    onAddItems(itemsToAdd);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-[#1d273f] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#182138] bg-[#0e1424]/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                Photo-Based Item Scanner
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/40 font-mono">
                  Phase 7
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Detect suitcase items locally using in-browser COCO-SSD machine learning
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top Tabs: Upload vs Camera */}
          {!imageSrc && (
            <div className="flex items-center space-x-2 border-b border-[#182138] pb-3">
              <button
                type="button"
                onClick={() => handleTabChange('upload')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 bg-[#12182a]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('camera')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'camera'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 bg-[#12182a]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Device Camera</span>
              </button>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section A: Photo Input View (Upload Zone or Camera Viewfinder) */}
          {!imageSrc ? (
            activeTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#233150] hover:border-blue-500/50 bg-[#0e1424]/40 hover:bg-[#121a30]/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-[#141d33] border border-[#223154] flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform shadow-inner">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Click or drag photo here to scan
                </h3>
                <p className="text-xs text-slate-400 mt-1 text-center max-w-sm">
                  Supports JPG, PNG, and WebP (up to 10 MB). Private photos are processed strictly inside your browser and never uploaded.
                </p>
              </div>
            ) : (
              <div className="bg-[#0e1424] border border-[#1b253e] rounded-2xl p-4 flex flex-col items-center">
                {cameraActive ? (
                  <div className="relative rounded-xl overflow-hidden max-w-lg w-full bg-black aspect-video flex items-center justify-center shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-blue-500/40 pointer-events-none rounded-xl" />
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center text-center">
                    <VideoOff className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-xs text-slate-400">
                      {cameraError || 'Camera stream is inactive or permission denied.'}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                    >
                      Retry Camera Access
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <div className="mt-4 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture & Scan Photo</span>
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Section B: Image Preview with Bounding Boxes & Actions */
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Photo Ready</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setImageSrc(null);
                    setReviewItems([]);
                    setHasScanned(false);
                    if (activeTab === 'camera') startCamera();
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace Photo</span>
                </button>
              </div>

              {/* Responsive Container for Image + Canvas Overlay */}
              <div className="relative rounded-2xl overflow-hidden border border-[#202c48] bg-[#060912] flex items-center justify-center max-h-[340px]">
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Scanned item preview"
                  onLoad={drawBoundingBoxes}
                  className="max-h-[340px] w-auto max-w-full object-contain"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                />

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                    <span className="text-xs font-semibold text-white">{processingStatus}</span>
                    <span className="text-[11px] text-slate-400 mt-1">Executing client-side TensorFlow model...</span>
                  </div>
                )}
              </div>

              {/* COCO-SSD Model Disclosure Notice */}
              <div className="p-3 rounded-xl bg-[#11192d] border border-[#1f2d4d] text-[11px] text-slate-300 flex items-start space-x-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-slate-100">COCO-SSD Detection Notice:</strong> The model reliably recognizes standard items (e.g. laptops, books, bottles, phones). Clothing articles and shoes are often missed by COCO-SSD's 80 classes. Review the detected list below or use the manual dropdown to adjust assignments.
                </div>
              </div>

              {/* Review List & Item Mapping */}
              <div className="bg-[#0e1424] border border-[#1b243b] rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#182138]">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Detected Objects Review ({reviewItems.length})
                    </h3>
                    {ignoredCount > 0 && (
                      <span className="text-[10px] text-slate-400">
                        ({ignoredCount} background object{ignoredCount > 1 ? 's' : ''} filtered)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item Manually</span>
                  </button>
                </div>

                {reviewItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No items identified yet. Click "Add Item Manually" above or try another photo.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {reviewItems.map((item) => {
                      const catalogItem = catalogData.find((c) => c.type === item.selectedType);
                      const scorePct = Math.round(item.score * 100);

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            item.included && item.selectedType
                              ? 'bg-[#12192d] border-[#223150]'
                              : 'bg-[#0f1422]/60 border-[#1a2337] opacity-60'
                          }`}
                        >
                          {/* Left: Checkbox + Detection Badge */}
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={item.included}
                              onChange={() => toggleInclude(item.id)}
                              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                            />

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-semibold text-white truncate capitalize">
                                  {item.detectedClass}
                                </span>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                    item.score >= 0.7
                                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                                      : item.score >= 0.5
                                      ? 'bg-blue-950/60 text-blue-300 border-blue-800/40'
                                      : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                                  }`}
                                >
                                  {scorePct}%
                                </span>
                              </div>

                              <span className="text-[10px] text-slate-400">
                                {item.selectedType
                                  ? `Maps to: ${catalogItem?.name || item.selectedType}`
                                  : 'Unassigned item'}
                              </span>
                            </div>
                          </div>

                          {/* Center: Catalog Item Selector Dropdown */}
                          <div className="flex items-center space-x-2 mx-2">
                            {catalogItem && (
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                                style={{ backgroundColor: `${catalogItem.color}25` }}
                              >
                                <ItemIcon type={catalogItem.type} color={catalogItem.color} className="w-4 h-4" />
                              </div>
                            )}

                            <select
                              value={item.selectedType}
                              onChange={(e) => handleTypeChange(item.id, e.target.value)}
                              className="bg-[#162138] border border-[#243456] text-xs text-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                            >
                              <option value="">-- Choose catalog item --</option>
                              {catalogData.map((cat) => (
                                <option key={cat.type} value={cat.type}>
                                  {cat.name} ({cat.dimensions.join('×')} cm)
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Right: Quantity Stepper & Delete */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <div className="flex items-center space-x-1 bg-[#162138] border border-[#243456] rounded-lg px-1 py-0.5">
                              <button
                                type="button"
                                disabled={item.quantity <= 1}
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs text-white px-1">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={item.quantity >= 10}
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveReviewItem(item.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#182138] bg-[#0c111e]">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-2 rounded-xl border border-[#212c46] text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            {imageSrc && (
              <span className="text-xs text-slate-400">
                {totalItemCountToAdd} item{totalItemCountToAdd !== 1 ? 's' : ''} ready
              </span>
            )}

            <button
              type="button"
              disabled={isSubmitting || totalItemCountToAdd === 0}
              onClick={handleConfirmAndAdd}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                totalItemCountToAdd > 0 && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95'
                  : 'bg-blue-600/30 border border-blue-500/20 text-blue-300/40 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Adding items...'
                  : `Add ${totalItemCountToAdd > 0 ? totalItemCountToAdd : ''} Items to Suitcase`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
