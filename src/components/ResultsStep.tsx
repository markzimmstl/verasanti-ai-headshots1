import React, { useState, useRef, useEffect } from 'react';
import {
  Download, ChevronLeft, Image as ImageIcon, CheckCircle, FileDown,
  Wand2, X, Loader2, RefreshCw, ChevronDown, ChevronUp, Eraser,
  Archive, Info
} from 'lucide-react';
import { GeneratedImage, GenerationConfig, MultiReferenceSet } from '../types';
import { refineGeneratedImage, magicErase, generateBrandPhotoWithRefsSafe } from '../services/geminiService';

interface ResultsStepProps {
  images: GeneratedImage[];
  onRestart: () => void;
  // NEW: needed for full-pipeline regeneration
  refs: MultiReferenceSet;
  baseConfig: GenerationConfig;
}

interface EditPreset {
  label: string;
  prompt: string;
  mode: 'edit' | 'regenerate';
  // For regenerate mode, these override the base config before re-running the pipeline
  configOverride?: Partial<GenerationConfig>;
}

const EDIT_CATEGORIES: { category: string; presets: EditPreset[] }[] = [
  {
    category: 'Body & Build',
    presets: [
      {
        label: 'Slimmer build',
        prompt: 'Slim build, narrow shoulders, lean and toned but not muscular.',
        mode: 'regenerate',
        configOverride: { bodySizeOffset: -2 },
      },
      {
        label: 'Fuller build',
        prompt: 'Fuller figure, broader shoulders, softer midsection, more substantial body frame.',
        mode: 'regenerate',
        configOverride: { bodySizeOffset: 2 },
      },
      {
        label: 'Less muscular',
        prompt: 'Average professional body type — not athletic or muscular. Slim the upper arms, narrow the shoulders, soften the chest.',
        mode: 'regenerate',
        configOverride: { bodySizeOffset: -1 },
      },
      {
        label: 'Fix cut-off body parts',
        prompt: 'Extend the image to show the complete subject — ensure feet are fully visible with floor below them, head is fully visible with air above, and no fingers or limbs are cropped.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Face & Expression',
    presets: [
      {
        label: 'More natural smile',
        prompt: 'Adjust the facial expression to a warm, natural, relaxed smile — genuine and approachable, not forced or overly posed.',
        mode: 'edit',
      },
      {
        label: 'More confident look',
        prompt: 'Adjust the expression to look more confident and authoritative — direct eye contact, slight jaw set, composed and powerful.',
        mode: 'edit',
      },
      {
        label: 'Remove glasses',
        prompt: "Remove the glasses from the subject's face entirely. Replace with natural skin and eyebrows matching the existing face.",
        mode: 'edit',
      },
      {
        label: 'Natural skin texture',
        prompt: 'Remove all beauty filter effects. Restore natural skin texture with visible pores, subtle lines, and realistic skin variation. The skin should look like a high-resolution photograph, not digitally smoothed.',
        mode: 'edit',
      },
      {
        label: 'Brighter light on face',
        prompt: 'Increase the brightness and lift on the face only. Open up the shadows under the eyes and chin. Keep the background unchanged.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Background & Scene',
    presets: [
      {
        label: 'Zoom out — show more scene',
        prompt: 'Zoom out significantly to reveal more of the surrounding environment. Keep the subject centered but smaller in the frame with more background visible on all sides.',
        mode: 'edit',
      },
      {
        label: 'Blur background more',
        prompt: 'Apply a stronger, more pronounced lens blur (shallow depth of field / bokeh effect) to the background. The subject must remain in sharp focus.',
        mode: 'edit',
      },
      {
        label: 'Remove distracting objects',
        prompt: 'Remove any distracting background objects, poles, signs, or clutter from behind the subject. Replace with clean neutral background material matching the existing scene.',
        mode: 'edit',
      },
      {
        label: 'Remove screen / monitor',
        prompt: 'Remove any television screens, computer monitors, projector screens, whiteboards, or smartboards from the background. Replace with wood paneling, stone, or art matching the existing scene.',
        mode: 'edit',
      },
      {
        label: 'Brighter, more airy scene',
        prompt: 'Increase overall brightness and lift shadows throughout the entire image. Make the scene feel more airy, open, and optimistic.',
        mode: 'edit',
      },
      {
        label: 'Moodier, darker atmosphere',
        prompt: 'Reduce overall brightness. Deepen shadows and increase contrast. Make the atmosphere feel more dramatic, serious, and cinematic.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Clothing & Color',
    presets: [
      {
        label: 'More professional clothing',
        prompt: 'Replace the current clothing with a more polished, professional option appropriate for a corporate headshot — a well-tailored blazer or suit jacket in a neutral color.',
        mode: 'edit',
      },
      {
        label: 'Remove tie',
        prompt: "Remove the necktie from the subject. Replace with a clean, open-collar shirt look that matches the existing shirt style and color.",
        mode: 'edit',
      },
      {
        label: 'Fix clothing color',
        prompt: 'Adjust the clothing color to a more neutral, professional tone — navy, charcoal, or dark grey. Keep the clothing style and cut identical.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Fun & Creative',
    presets: [
      {
        label: '📱 Phone pic look',
        prompt: 'Recreate this image to look like it was taken on a smartphone camera by a friend — slightly casual framing, natural ambient or available light, no professional lighting setup, slight lens distortion typical of a phone camera, authentic and candid feel. If the scene suggests evening or night, simulate on-camera flash: harsh direct flash lighting, slight red-eye reduction glow, flat frontal illumination, slightly overexposed face against a darker background.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Overall Quality',
    presets: [
      {
        label: 'Sharpen overall detail',
        prompt: 'Increase overall image sharpness and micro-contrast. Enhance fine detail in the face, clothing, and background.',
        mode: 'edit',
      },
      {
        label: 'Fix AI artifacts',
        prompt: 'Fix any unnatural AI artifacts — incorrect finger counts, asymmetrical facial features, distorted clothing seams, or unrealistic skin patterns. Make the image look like a real photograph.',
        mode: 'edit',
      },
    ],
  },
];

const getAspectClass = (ratio?: string): string => {
  switch (ratio) {
    case '16:9': return 'aspect-video';
    case '9:16': return 'aspect-[9/16]';
    case '4:5':  return 'aspect-[4/5]';
    case '3:1':  return 'aspect-[3/1]';
    case '4:1':  return 'aspect-[4/1]';
    default:     return 'aspect-square';
  }
};

// Load JSZip dynamically from CDN
const loadJSZip = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).JSZip) { resolve((window as any).JSZip); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve((window as any).JSZip);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const ResultsStep: React.FC<ResultsStepProps> = ({ images, onRestart, refs, baseConfig }) => {
  const [displayImages, setDisplayImages] = useState<GeneratedImage[]>(images);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(images.length > 0 ? images[0] : null);

  // Edit state
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState<'presets' | 'eraser'>('presets');
  const [editPrompt, setEditPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<EditPreset | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Body & Build');

  // Download All state
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [showDownloadTip, setShowDownloadTip] = useState(false);

  // Magic Eraser state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [hasMask, setHasMask] = useState(false);

  // Set up eraser canvas when switching to eraser mode
  useEffect(() => {
    if (editMode === 'eraser' && selectedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasMask(false);
      };
      img.src = selectedImage.imageUrl;
    }
  }, [editMode, selectedImage]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else { clientX = e.clientX; clientY = e.clientY; }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasMask(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setHasMask(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearMask = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasMask(false);
  };

  const handleApplyErase = async () => {
    if (!selectedImage || !canvasRef.current || !hasMask) return;
    setIsRefining(true);
    setEditError(null);
    try {
      const maskBase64 = canvasRef.current.toDataURL('image/png');
      const aspectRatio = (selectedImage.aspectRatio || '1:1') as any;
      const resultUrl = await magicErase(selectedImage.imageUrl, maskBase64, aspectRatio);
      const newImage: GeneratedImage = {
        id: Date.now().toString() + Math.random(),
        originalUrl: resultUrl,
        imageUrl: resultUrl,
        styleName: `${selectedImage.styleName} (Erased)`,
        styleId: selectedImage.styleId,
        createdAt: Date.now(),
        aspectRatio: selectedImage.aspectRatio,
      };
      setDisplayImages(prev => {
        const idx = prev.findIndex(img => img.id === selectedImage.id);
        const updated = [...prev];
        updated.splice(idx + 1, 0, newImage);
        return updated;
      });
      setSelectedImage(newImage);
      setIsEditPanelOpen(false);
      setEditMode('presets');
    } catch {
      setEditError('Magic Eraser failed. Try painting over a smaller or more specific area and try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSelectPreset = (preset: EditPreset) => {
    setSelectedPreset(preset);
    setEditPrompt(preset.prompt);
  };

  // ─── APPLY EDIT (surface changes via refineGeneratedImage) ───────────────────
  const handleApplyEdit = async () => {
    if (!selectedImage || !editPrompt.trim()) return;
    setIsRefining(true);
    setEditError(null);
    try {
      const aspectRatio = (selectedImage.aspectRatio || '1:1') as any;
      const refinedUrl = await refineGeneratedImage(selectedImage.imageUrl, editPrompt, aspectRatio);
      insertEditedImage(refinedUrl, selectedImage, '(Edited)');
    } catch {
      setEditError("This edit didn't take. Try rephrasing with more specific visual detail, or use Regenerate for structural changes.");
    } finally {
      setIsRefining(false);
    }
  };

  // ─── REGENERATE (full pipeline from original refs) ────────────────────────────
  // This bypasses the already-generated image entirely and re-runs the full
  // generateBrandPhotoWithRefsSafe pipeline with a modified config.
  // Body structure changes are dramatically more reliable this way.
  const handleRegenerate = async () => {
    if (!selectedImage || !editPrompt.trim()) return;
    setIsRefining(true);
    setEditError(null);
    try {
      // Build the modified config:
      // - Start from the image's own stored config if available, else use baseConfig
      // - Apply any preset configOverride (e.g. bodySizeOffset: -2)
      // - Inject the edit prompt as an additional instruction into the scene prompt
      const imageConfig: GenerationConfig = (selectedImage as any).originalConfig || baseConfig;
      const presetOverrides = selectedPreset?.configOverride || {};

      const regenerateConfig: GenerationConfig = {
        ...imageConfig,
        ...presetOverrides,
      };

      // The stylePrompt stored on the image, or fall back to backgroundType
      const originalStylePrompt: string =
        (selectedImage as any).stylePrompt ||
        imageConfig.backgroundType ||
        'Professional studio portrait';

      // Append the freeform edit instruction as extra context for the prompt builder
      const augmentedStylePrompt = `${originalStylePrompt}

ADDITIONAL INSTRUCTION FOR THIS GENERATION:
${editPrompt}`;

      const resultUrl = await generateBrandPhotoWithRefsSafe(
        refs,
        augmentedStylePrompt,
        regenerateConfig,
        regenerateConfig.customBackground,
        // globalIndex: use a random offset so we don't always get the same Rule of Thirds variant
        Math.floor(Math.random() * 10)
      );

      insertEditedImage(resultUrl, selectedImage, '(Regenerated)');
    } catch (err: any) {
      setEditError('Regeneration failed. Please try again. If the problem persists, try Apply Edit instead.');
    } finally {
      setIsRefining(false);
    }
  };

  const insertEditedImage = (url: string, source: GeneratedImage, label: string) => {
    const newImage: GeneratedImage = {
      id: Date.now().toString() + Math.random(),
      originalUrl: url,
      imageUrl: url,
      styleName: `${source.styleName} ${label}`,
      styleId: source.styleId,
      createdAt: Date.now(),
      aspectRatio: source.aspectRatio,
      // Carry forward the original style context so future regenerations keep working
      ...(({ stylePrompt: (source as any).stylePrompt, originalConfig: (source as any).originalConfig }) as any),
    };
    setDisplayImages(prev => {
      const idx = prev.findIndex(img => img.id === source.id);
      const updated = [...prev];
      updated.splice(idx + 1, 0, newImage);
      return updated;
    });
    setSelectedImage(newImage);
    setEditPrompt('');
    setSelectedPreset(null);
    setIsEditPanelOpen(false);
  };

  const downloadImage = async (url: string, format: 'webp' | 'png') => {
    try {
      const response = await fetch(url);
      const sourceBlob = await response.blob();
      const bitmap = await createImageBitmap(sourceBlob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
      const finalBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed')), mimeType, format === 'webp' ? 0.85 : undefined);
      });
      const filename = `VeraLooks-Headshot.${format}`;
      if ('showSaveFilePicker' in window) {
        try {
          const fh = await (window as any).showSaveFilePicker({ suggestedName: filename, types: [{ description: `${format.toUpperCase()} Image`, accept: { [mimeType]: [`.${format}`] } }] });
          const w = await fh.createWritable();
          await w.write(finalBlob);
          await w.close();
          return;
        } catch (err: any) { if (err.name === 'AbortError') return; }
      }
      const blobUrl = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Download failed. Please try right-clicking the image to save.');
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      const folder = zip.folder('VeraLooks-Photos');
      await Promise.all(
        displayImages.map(async (img, idx) => {
          const res = await fetch(img.imageUrl);
          const blob = await res.blob();
          const ext = img.imageUrl.includes('image/png') ? 'png' : 'jpg';
          const name = `VeraLooks-${String(idx + 1).padStart(2, '0')}-${img.styleName.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30)}.${ext}`;
          folder?.file(name, blob);
        })
      );
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url; a.download = 'VeraLooks-Photos.zip';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      setShowDownloadTip(true);
    } catch {
      alert('Download All failed. Please download images individually.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const activePresetMode = selectedPreset?.mode ?? 'edit';
  const aspectClass = getAspectClass(selectedImage?.aspectRatio);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle className="text-green-500 h-8 w-8" />
            Your Professional Results
          </h2>
          <p className="text-gray-600 mt-2">
            {displayImages.length} image{displayImages.length !== 1 ? 's' : ''} generated. Select one to download or edit.
          </p>
        </div>
        <button onClick={onRestart} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm active:scale-95">
          <ChevronLeft size={20} />
          Create New Look
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Large Preview */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-100 overflow-hidden group">
            {selectedImage ? (
              <div className={`relative ${aspectClass} bg-gray-50 rounded-2xl overflow-hidden`}>
                <img src={selectedImage.imageUrl} alt="Selected Headshot" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <ImageIcon className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Edit Panel */}
          {selectedImage && (
            <div className="mt-4">
              {!isEditPanelOpen ? (
                <button onClick={() => { setIsEditPanelOpen(true); setEditMode('presets'); }} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-sm">
                  <Wand2 size={18} />
                  Edit This Image
                </button>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-4">

                  {/* Panel header with mode tabs */}
                  <div className="flex items-center justify-between">
                    <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                      <button
                        onClick={() => setEditMode('presets')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${editMode === 'presets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <Wand2 size={12} /> Edit / Enhance
                      </button>
                      <button
                        onClick={() => setEditMode('eraser')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${editMode === 'eraser' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <Eraser size={12} /> Magic Eraser
                      </button>
                    </div>
                    <button onClick={() => { setIsEditPanelOpen(false); setEditError(null); setEditPrompt(''); setSelectedPreset(null); setEditMode('presets'); }} className="text-gray-400 hover:text-gray-600">
                      <X size={18} />
                    </button>
                  </div>

                  {/* PRESETS MODE */}
                  {editMode === 'presets' && (
                    <>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-800">Tip:</span> Use <strong>Apply Edit</strong> for lighting, background &amp; color tweaks. Use <strong>Regenerate</strong> for body shape, build, and structure — it re-runs the full pipeline from your original photos for maximum impact.
                      </div>

                      {/* Preset categories */}
                      <div className="space-y-2">
                        {EDIT_CATEGORIES.map((cat) => (
                          <div key={cat.category} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            >
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{cat.category}</span>
                              {expandedCategory === cat.category ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                            </button>
                            {expandedCategory === cat.category && (
                              <div className="px-4 pb-3 pt-2 flex flex-wrap gap-2">
                                {cat.presets.map((preset) => (
                                  <button
                                    key={preset.label}
                                    onClick={() => handleSelectPreset(preset)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${selectedPreset?.label === preset.label ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600'}`}
                                  >
                                    {preset.mode === 'regenerate' && (
                                      <RefreshCw size={10} className={selectedPreset?.label === preset.label ? 'text-white' : 'text-indigo-400'} />
                                    )}
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Preset mode hint */}
                      {selectedPreset && (
                        <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed border ${selectedPreset.mode === 'regenerate' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                          {selectedPreset.mode === 'regenerate'
                            ? <><span className="font-semibold">⚡ Deep regeneration preset.</span> Click "Regenerate" — this re-runs from your original reference photos for strong structural changes.</>
                            : <><span className="font-semibold">✓ Surface edit preset.</span> Click "Apply Edit" for this change.</>}
                        </div>
                      )}

                      {/* Freeform prompt */}
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Custom instruction (optional)</label>
                        <textarea
                          value={editPrompt}
                          onChange={(e) => { setEditPrompt(e.target.value); setSelectedPreset(null); }}
                          placeholder="Describe your edit with specific detail..."
                          rows={3}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                        />
                      </div>

                      {editError && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">{editError}</div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleApplyEdit}
                          disabled={!editPrompt.trim() || isRefining}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                        >
                          {isRefining ? <><Loader2 size={15} className="animate-spin" />Working…</> : <><Wand2 size={15} />Apply Edit</>}
                        </button>
                        <button
                          onClick={handleRegenerate}
                          disabled={!editPrompt.trim() || isRefining}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                        >
                          {isRefining ? <><Loader2 size={15} className="animate-spin" />Working…</> : <><RefreshCw size={15} />Regenerate</>}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400 text-center">
                        <strong>Apply Edit</strong> — fast surface changes (lighting, color, background). <strong>Regenerate</strong> — rebuilds from your reference photos for body shape and structural changes.
                      </p>
                    </>
                  )}

                  {/* MAGIC ERASER MODE */}
                  {editMode === 'eraser' && (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                        <span className="font-semibold">Paint over anything you want removed.</span> Use red brush strokes to cover the object, then click "Erase &amp; Fill". Works best on discrete objects like signs, poles, or people in the background.
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Brush size</label>
                        <input type="range" min={8} max={60} step={2} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="flex-1 accent-indigo-500" />
                        <span className="text-xs text-gray-500 w-6">{brushSize}</span>
                      </div>

                      <div className={`relative ${aspectClass} w-full rounded-xl overflow-hidden border-2 border-indigo-300 bg-gray-100`} style={{ cursor: 'crosshair' }}>
                        {selectedImage && (
                          <img src={selectedImage.imageUrl} alt="Erase target" className="absolute inset-0 w-full h-full object-contain" />
                        )}
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full"
                          style={{ opacity: 0.7, touchAction: 'none' }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>

                      {editError && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">{editError}</div>}

                      <div className="flex gap-3">
                        <button onClick={clearMask} disabled={!hasMask || isRefining} className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-40">
                          Clear
                        </button>
                        <button onClick={handleApplyErase} disabled={!hasMask || isRefining} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-40 text-sm">
                          {isRefining ? <><Loader2 size={15} className="animate-spin" />Erasing…</> : <><Eraser size={15} />Erase &amp; Fill</>}
                        </button>
                      </div>
                    </>
                  )}

                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">

          {/* Download */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-600" />
              Download Options
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => selectedImage && downloadImage(selectedImage.imageUrl, 'png')} disabled={!selectedImage} className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100">
                <FileDown size={22} />Download Hi-Res PNG
              </button>
              <button onClick={() => selectedImage && downloadImage(selectedImage.imageUrl, 'webp')} disabled={!selectedImage} className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <Download size={22} />Download Web-Ready WebP
              </button>
              <button onClick={handleDownloadAll} disabled={displayImages.length === 0 || isDownloadingAll} className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isDownloadingAll ? <><Loader2 size={20} className="animate-spin" />Zipping…</> : <><Archive size={20} />Download All ({displayImages.length})</>}
              </button>
            </div>

            {showDownloadTip && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                  <Info size={13} /> How to open your ZIP file
                </div>
                <p><strong>Mac:</strong> Double-click the .zip in Finder — extracts automatically.</p>
                <p><strong>Windows:</strong> Right-click → "Extract All".</p>
                <p><strong>iPhone/iPad:</strong> Tap in Files app — extracts in place (iOS 13+).</p>
                <p><strong>Android:</strong> Open with Files app — most unzip natively.</p>
                <button onClick={() => setShowDownloadTip(false)} className="text-blue-500 underline mt-1">Got it</button>
              </div>
            )}

            <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
              Standard commercial license included.
            </p>
          </div>

          {/* Thumbnail Gallery */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">All Generations ({displayImages.length})</h3>
            <div className="grid grid-cols-3 gap-3">
              {displayImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage?.id === img.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent hover:border-gray-200'}`}
                >
                  <img src={img.imageUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  {img.styleName?.includes('(Edited)') && (
                    <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 text-white text-[9px] text-center py-0.5 font-semibold tracking-wide">EDITED</div>
                  )}
                  {img.styleName?.includes('(Regenerated)') && (
                    <div className="absolute bottom-0 left-0 right-0 bg-violet-600/80 text-white text-[9px] text-center py-0.5 font-semibold tracking-wide">REGEN</div>
                  )}
                  {img.styleName?.includes('(Erased)') && (
                    <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/80 text-white text-[9px] text-center py-0.5 font-semibold tracking-wide">ERASED</div>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultsStep;
