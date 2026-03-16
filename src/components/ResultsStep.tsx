import React, { useState, useRef, useEffect } from 'react';
import {
  Download, ChevronLeft, Image as ImageIcon, CheckCircle, FileDown,
  Wand2, X, Loader2, RefreshCw, ChevronDown, ChevronUp, Eraser,
  Archive, Info, Zap
} from 'lucide-react';
import { GeneratedImage, GenerationConfig, MultiReferenceSet } from '../types';
import { refineGeneratedImage, magicErase, generateBrandPhotoWithRefsSafe } from '../services/geminiService';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:           '#080A0F',
  panel:        'rgba(255,255,255,0.03)',
  panelBorder:  'rgba(255,255,255,0.07)',
  panelHover:   'rgba(255,255,255,0.05)',
  purple:       '#9F67FF',
  purpleDeep:   '#4C1D95',
  purpleDim:    'rgba(76,29,149,0.15)',
  purpleBorder: 'rgba(76,29,149,0.3)',
  purpleGrad:   'linear-gradient(135deg, #2E1065, #4C1D95)',
  teal:         '#0D9488',
  tealDim:      'rgba(13,148,136,0.12)',
  tealBorder:   'rgba(13,148,136,0.3)',
  amber:        '#F59E0B',
  amberDim:     'rgba(245,158,11,0.1)',
  amberBorder:  'rgba(245,158,11,0.25)',
  red:          'rgba(239,68,68,0.85)',
  redDim:       'rgba(239,68,68,0.08)',
  redBorder:    'rgba(239,68,68,0.2)',
  white:        '#FFFFFF',
  white80:      'rgba(255,255,255,0.8)',
  white60:      'rgba(255,255,255,0.6)',
  white40:      'rgba(255,255,255,0.4)',
  white20:      'rgba(255,255,255,0.2)',
  white10:      'rgba(255,255,255,0.1)',
  white06:      'rgba(255,255,255,0.06)',
  white03:      'rgba(255,255,255,0.03)',
  serif:        "'Cormorant Garamond', serif",
  sans:         "'DM Sans', sans-serif",
};

interface ResultsStepProps {
  onGenerateMore?: () => void;
  images: GeneratedImage[];
  onRestart: () => void;
  refs: MultiReferenceSet;
  baseConfig: GenerationConfig;
  credits: number;
  onSpendCredit: (amount: number) => void;
  onRequestTopUp: () => void;
}

interface EditPreset {
  label: string;
  prompt: string;
  mode: 'edit' | 'regenerate';
  configOverride?: Partial<GenerationConfig>;
}

const EDIT_CATEGORIES: { category: string; presets: EditPreset[] }[] = [
  {
    category: 'Body & Build',
    presets: [
      { label: 'Slimmer build', prompt: 'Slim build, narrow shoulders, lean and toned but not muscular.', mode: 'regenerate', configOverride: { bodySizeOffset: -2 } },
      { label: 'Fuller build', prompt: 'Fuller figure, broader shoulders, softer midsection, more substantial body frame.', mode: 'regenerate', configOverride: { bodySizeOffset: 2 } },
      { label: 'Less muscular', prompt: 'Average professional body type — not athletic or muscular. Slim the upper arms, narrow the shoulders, soften the chest.', mode: 'regenerate', configOverride: { bodySizeOffset: -1 } },
      { label: 'Fix cut-off body parts', prompt: 'Extend the image to show the complete subject — ensure feet are fully visible with floor below them, head is fully visible with air above, and no fingers or limbs are cropped.', mode: 'edit' },
    ],
  },
  {
    category: 'Face & Expression',
    presets: [
      { label: 'More natural smile', prompt: 'Adjust the facial expression to a warm, natural, relaxed smile — genuine and approachable, not forced or overly posed.', mode: 'edit' },
      { label: 'More confident look', prompt: 'Adjust the expression to look more confident and authoritative — direct eye contact, slight jaw set, composed and powerful.', mode: 'edit' },
      { label: 'Remove glasses', prompt: "Remove the glasses from the subject's face entirely. Replace with natural skin and eyebrows matching the existing face.", mode: 'edit' },
      { label: 'Natural skin texture', prompt: 'Remove all beauty filter effects. Restore natural skin texture with visible pores, subtle lines, and realistic skin variation. The skin should look like a high-resolution photograph, not digitally smoothed.', mode: 'edit' },
      { label: 'Brighter light on face', prompt: 'Increase the brightness and lift on the face only. Open up the shadows under the eyes and chin. Keep the background unchanged.', mode: 'edit' },
    ],
  },
  {
    category: 'Background & Scene',
    presets: [
      { label: 'Zoom out — show more scene', prompt: 'Zoom out significantly to reveal more of the surrounding environment. Keep the subject centered but smaller in the frame with more background visible on all sides.', mode: 'edit' },
      { label: 'Blur background more', prompt: 'Apply a stronger, more pronounced lens blur (shallow depth of field / bokeh effect) to the background. The subject must remain in sharp focus.', mode: 'edit' },
      { label: 'Remove distracting objects', prompt: 'Remove any distracting background objects, poles, signs, or clutter from behind the subject. Replace with clean neutral background material matching the existing scene.', mode: 'edit' },
      { label: 'Remove screen / monitor', prompt: 'Remove any television screens, computer monitors, projector screens, whiteboards, or smartboards from the background. Replace with wood paneling, stone, or art matching the existing scene.', mode: 'edit' },
      { label: 'Brighter, more airy scene', prompt: 'Increase overall brightness and lift shadows throughout the entire image. Make the scene feel more airy, open, and optimistic.', mode: 'edit' },
      { label: 'Moodier, darker atmosphere', prompt: 'Reduce overall brightness. Deepen shadows and increase contrast. Make the atmosphere feel more dramatic, serious, and cinematic.', mode: 'edit' },
    ],
  },
  {
    category: 'Clothing & Color',
    presets: [
      { label: 'More professional clothing', prompt: 'Replace the current clothing with a more polished, professional option appropriate for a corporate headshot — a well-tailored blazer or suit jacket in a neutral color.', mode: 'edit' },
      { label: 'Remove tie', prompt: "Remove the necktie from the subject. Replace with a clean, open-collar shirt look that matches the existing shirt style and color.", mode: 'edit' },
      { label: 'Fix clothing color', prompt: 'Adjust the clothing color to a more neutral, professional tone — navy, charcoal, or dark grey. Keep the clothing style and cut identical.', mode: 'edit' },
    ],
  },
  {
    category: 'Fun & Creative',
    presets: [
      { label: '📱 Phone pic look', prompt: 'Recreate this image to look like it was taken on a smartphone camera by a friend — slightly casual framing, natural ambient or available light, no professional lighting setup, slight lens distortion typical of a phone camera, authentic and candid feel, deep depth of field so nearly everything is in focus (as phones render), no vignette, no lens blur, no shallow bokeh. If the scene suggests evening or night, simulate on-camera flash: harsh direct flash lighting, slight red-eye reduction glow, flat frontal illumination, slightly overexposed face against a darker background. NEGATIVE: no vignette, no heavy vignette, no dark edges, no bokeh blur.', mode: 'edit' },
      { label: '🎨 Graphic Novel', prompt: 'Reimagine this portrait in a graphic novel illustration style — bold dark ink outlines defining the subject and all features, flat areas of color with minimal shading, high contrast between light and shadow, dramatic comic-book composition. The entire image including background should be fully illustrated, not photographic.', mode: 'edit' },
      { label: '🖼️ Oil Painting', prompt: 'Fully repaint this portrait as a classical oil painting. The ENTIRE image — face, clothing, hands, and background — must be rendered in oil paint with no photographic elements remaining. Use thick, visible impasto brushstrokes throughout. Rich, saturated warm palette. Deep shadows with layered glazing. Highlights built up with textured paint. The canvas texture must be visible beneath the pigment. The face should retain likeness but be clearly painted, not photographic. Background should be loose, expressive brushwork — not a blurred photo.', mode: 'edit' },
      { label: '🌊 Watercolor Portrait', prompt: 'Fully repaint this portrait as a hand-painted watercolor illustration. The ENTIRE image must be rendered in watercolor — no photographic elements should remain. Use wet-on-wet washes with visible color bleeds and blooms. Edges should be soft and slightly undefined where wash meets wash. Visible paper texture throughout. Colors should be luminous and slightly transparent. Shadows built from layered washes, not solid fills. The face should retain likeness but be clearly illustrated in watercolor. Background should dissolve into loose, expressive washes of color.', mode: 'edit' },
      { label: '✨ Studio Ghibli Style', prompt: 'Fully reimagine this portrait as a Studio Ghibli animated film cel. The ENTIRE image — subject, clothing, hair, skin, and background — must be hand-drawn animation illustration with NO photographic elements remaining. Clean anime linework outlining every feature. Skin rendered with flat anime shading and soft blush tones. Hair with distinct animated highlight shapes. Eyes large, expressive, luminous with anime-style catchlights. Clothing with simplified folds typical of Ghibli character design. Background fully illustrated as a lush painterly Ghibli environment — not a blurred photo backdrop. The overall image should look like a production cel from a Ghibli film.', mode: 'edit' },
      { label: '🧊 3D Cartoon', prompt: 'Reimagine this portrait as a high-quality 3D animated character — the style of Pixar or DreamWorks feature films. The ENTIRE image must be 3D rendered illustration with no photographic elements remaining. Smooth, slightly exaggerated 3D character with rounded features and stylized proportions. Large expressive eyes with subsurface scattering skin. Simplified but detailed clothing with clean 3D shading and subtle ambient occlusion. Background fully rendered as a 3D animated environment with soft depth of field. Global illumination lighting — warm key light, cool fill, subtle rim. The overall image should look like a still from a major 3D animated feature film.', mode: 'edit' },
    ],
  },
  {
    category: 'Overall Quality',
    presets: [
      { label: 'Sharpen overall detail', prompt: 'Increase overall image sharpness and micro-contrast. Enhance fine detail in the face, clothing, and background.', mode: 'edit' },
      { label: 'Fix AI artifacts', prompt: 'Fix any unnatural AI artifacts — incorrect finger counts, asymmetrical facial features, distorted clothing seams, or unrealistic skin patterns. Make the image look like a real photograph.', mode: 'edit' },
    ],
  },
];

const REGEN_ALL_PRESETS: EditPreset[] = EDIT_CATEGORIES.flatMap(c => c.presets).filter(p => p.mode === 'regenerate');

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

const loadJSZip = (): Promise<any> => new Promise((resolve, reject) => {
  if ((window as any).JSZip) { resolve((window as any).JSZip); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  s.onload = () => resolve((window as any).JSZip);
  s.onerror = reject;
  document.head.appendChild(s);
});

// ── Sub-components defined OUTSIDE to prevent remount ────────────────────────
const ModeTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button type="button" onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: T.sans,
    background: active ? T.purpleGrad : 'transparent',
    border: `1px solid ${active ? 'rgba(76,29,149,0.6)' : T.panelBorder}`,
    color: active ? T.white : T.white40,
    boxShadow: active ? '0 4px 16px rgba(46,16,101,0.35)' : 'none',
  }}>{icon}{label}</button>
);

const PresetPill: React.FC<{ active: boolean; onClick: () => void; isRegen?: boolean; label: string }> = ({ active, onClick, isRegen, label }) => (
  <button type="button" onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    borderRadius: 100, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: T.sans,
    background: active ? T.purpleGrad : T.panel,
    border: `1px solid ${active ? 'rgba(76,29,149,0.6)' : T.panelBorder}`,
    color: active ? T.white : T.white60,
    boxShadow: active ? '0 4px 16px rgba(46,16,101,0.25)' : 'none',
  }}>
    {isRegen && <RefreshCw style={{ width: 10, height: 10 }} />}
    {label}
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────
const ResultsStep: React.FC<ResultsStepProps> = ({ images, onRestart, onGenerateMore, refs, baseConfig, credits, onSpendCredit, onRequestTopUp }) => {
  const [displayImages, setDisplayImages] = useState<GeneratedImage[]>(images);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(images[0] ?? null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState<'presets' | 'eraser' | 'regenAll'>('presets');
  const [editPrompt, setEditPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<EditPreset | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Body & Build');

  const [regenAllPreset, setRegenAllPreset] = useState<EditPreset | null>(null);
  const [regenAllPrompt, setRegenAllPrompt] = useState('');
  const [isRegenAll, setIsRegenAll] = useState(false);
  const [regenAllProgress, setRegenAllProgress] = useState<{ current: number; total: number } | null>(null);
  const [regenAllError, setRegenAllError] = useState<string | null>(null);
  const regenAllCancelRef = useRef(false);

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [showDownloadTip, setShowDownloadTip] = useState(false);
  const [downloadAllFormat, setDownloadAllFormat] = useState<'png' | 'webp' | 'both'>('png');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [hasMask, setHasMask] = useState(false);

  useEffect(() => {
    if (editMode === 'eraser' && selectedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.clearRect(0, 0, canvas.width, canvas.height); setHasMask(false); };
      img.src = selectedImage.imageUrl;
    }
  }, [editMode, selectedImage]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = brushSize; ctx.lineCap = ctx.lineJoin = 'round';
    const pos = getCanvasPos(e);
    ctx.beginPath(); ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2); ctx.fill();
    setHasMask(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    setHasMask(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearMask = () => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height); setHasMask(false);
  };

  const checkAndSpendCredit = (amount: number): boolean => {
    if (credits < amount) {
      onRequestTopUp();
      return false;
    }
    onSpendCredit(amount);
    return true;
  };

  const handleApplyErase = async () => {
    if (!selectedImage || !canvasRef.current || !hasMask) return;
    if (!checkAndSpendCredit(1)) return;
    setIsRefining(true); setEditError(null);
    try {
      const maskBase64 = canvasRef.current.toDataURL('image/png');
      const resultUrl = await magicErase(selectedImage.imageUrl, maskBase64, (selectedImage.aspectRatio || '1:1') as any);
      const newImg: GeneratedImage = { id: Date.now() + '' + Math.random(), originalUrl: resultUrl, imageUrl: resultUrl, styleName: `${selectedImage.styleName} (Erased)`, styleId: selectedImage.styleId, createdAt: Date.now(), aspectRatio: selectedImage.aspectRatio };
      setDisplayImages(prev => { const updated = [...prev]; updated.splice(prev.findIndex(i => i.id === selectedImage.id) + 1, 0, newImg); return updated; });
      setSelectedImage(newImg); setIsEditPanelOpen(false); setEditMode('presets');
    } catch { setEditError('Magic Eraser failed. Try painting over a smaller area and try again.'); }
    finally { setIsRefining(false); }
  };

  const handleSelectPreset = (preset: EditPreset) => { setSelectedPreset(preset); setEditPrompt(preset.prompt); };

  const handleApplyEdit = async () => {
    if (!selectedImage || !editPrompt.trim()) return;
    if (!checkAndSpendCredit(1)) return;
    setIsRefining(true); setEditError(null);
    try {
      const refinedUrl = await refineGeneratedImage(selectedImage.imageUrl, editPrompt, (selectedImage.aspectRatio || '1:1') as any);
      insertEditedImage(refinedUrl, selectedImage, '(Edited)');
    } catch { setEditError("This edit didn't take. Try rephrasing with more specific visual detail, or use Regenerate for structural changes."); }
    finally { setIsRefining(false); }
  };

  const handleRegenerate = async () => {
    if (!selectedImage || !editPrompt.trim()) return;
    if (!checkAndSpendCredit(1)) return;
    setIsRefining(true); setEditError(null);
    try {
      const imageConfig: GenerationConfig = (selectedImage as any).originalConfig || baseConfig;
      const regenerateConfig = { ...imageConfig, ...(selectedPreset?.configOverride || {}) };
      const stylePrompt = (selectedImage as any).stylePrompt || imageConfig.backgroundType || 'Professional studio portrait';
      const resultUrl = await generateBrandPhotoWithRefsSafe(refs, `${stylePrompt}\n\nADDITIONAL INSTRUCTION:\n${editPrompt}`, regenerateConfig, regenerateConfig.customBackground, Math.floor(Math.random() * 10));
      insertEditedImage(resultUrl, selectedImage, '(Regenerated)');
    } catch { setEditError('Regeneration failed. Please try again or use Apply Edit instead.'); }
    finally { setIsRefining(false); }
  };

  const handleRegenAll = async () => {
    const prompt = regenAllPrompt.trim();
    if (!prompt) return;
    const originals = displayImages.filter(img => !img.styleName.includes('(Edited)') && !img.styleName.includes('(Regenerated)') && !img.styleName.includes('(Erased)'));
    if (!originals.length) return;
    if (!checkAndSpendCredit(originals.length)) return;
    setIsRegenAll(true); setRegenAllError(null); regenAllCancelRef.current = false;
    setRegenAllProgress({ current: 0, total: originals.length });
    const insertions: { sourceId: string; newImage: GeneratedImage }[] = [];
    try {
      for (let i = 0; i < originals.length; i++) {
        if (regenAllCancelRef.current) break;
        const source = originals[i];
        setRegenAllProgress({ current: i + 1, total: originals.length });
        const imageConfig: GenerationConfig = (source as any).originalConfig || baseConfig;
        const regenerateConfig = { ...imageConfig, ...(regenAllPreset?.configOverride || {}) };
        const stylePrompt = (source as any).stylePrompt || imageConfig.backgroundType || 'Professional studio portrait';
        const resultUrl = await generateBrandPhotoWithRefsSafe(refs, `${stylePrompt}\n\nADDITIONAL INSTRUCTION:\n${prompt}`, regenerateConfig, regenerateConfig.customBackground, Math.floor(Math.random() * 10));
        const newImg: GeneratedImage = { id: Date.now() + '' + Math.random(), originalUrl: resultUrl, imageUrl: resultUrl, styleName: `${source.styleName} (Regenerated)`, styleId: source.styleId, createdAt: Date.now(), aspectRatio: source.aspectRatio, stylePrompt: (source as any).stylePrompt, originalConfig: (source as any).originalConfig };
        insertions.push({ sourceId: source.id, newImage: newImg });
        setDisplayImages(prev => { const updated = [...prev]; const idx = updated.findIndex(img => img.id === source.id); if (idx !== -1) updated.splice(idx + 1, 0, newImg); return updated; });
      }
      if (insertions.length) setSelectedImage(insertions[0].newImage);
      if (!regenAllCancelRef.current) { setIsEditPanelOpen(false); setEditMode('presets'); }
    } catch { setRegenAllError(`Regeneration failed on image ${regenAllProgress?.current ?? '?'}. Completed images have been added.`); }
    finally { setIsRegenAll(false); setRegenAllProgress(null); regenAllCancelRef.current = false; }
  };

  const insertEditedImage = (url: string, source: GeneratedImage, label: string) => {
    const newImg: GeneratedImage = { id: Date.now() + '' + Math.random(), originalUrl: url, imageUrl: url, styleName: `${source.styleName} ${label}`, styleId: source.styleId, createdAt: Date.now(), aspectRatio: source.aspectRatio, ...(({ stylePrompt: (source as any).stylePrompt, originalConfig: (source as any).originalConfig }) as any) };
    setDisplayImages(prev => { const updated = [...prev]; updated.splice(prev.findIndex(i => i.id === source.id) + 1, 0, newImg); return updated; });
    setSelectedImage(newImg); setEditPrompt(''); setSelectedPreset(null); setIsEditPanelOpen(false);
  };

  const downloadImage = async (url: string, format: 'webp' | 'png') => {
    try {
      const blob = await fetch(url).then(r => r.blob());
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
      const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
      const filename = `VeraLooks-Headshot.${format}`;
      const finalBlob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Failed')), mimeType, format === 'webp' ? 0.85 : undefined));
      if ('showSaveFilePicker' in window) {
        try { const fh = await (window as any).showSaveFilePicker({ suggestedName: filename, types: [{ description: `${format.toUpperCase()}`, accept: { [mimeType]: [`.${format}`] } }] }); const w = await fh.createWritable(); await w.write(finalBlob); await w.close(); return; }
        catch (err: any) { if (err.name === 'AbortError') return; }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(finalBlob); a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { alert('Download failed. Please try right-clicking the image to save.'); }
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip(); const folder = zip.folder('VeraLooks-Photos');
      await Promise.all(displayImages.map(async (img, idx) => {
        const res = await fetch(img.imageUrl);
        const sourceBlob = await res.blob();
        const bitmap = await createImageBitmap(sourceBlob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
        const baseName = `VeraLooks-${String(idx + 1).padStart(2, '0')}-${img.styleName.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30)}`;
        const addFormat = async (fmt: 'png' | 'webp') => {
          const mimeType = fmt === 'webp' ? 'image/webp' : 'image/png';
          const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('fail')), mimeType, fmt === 'webp' ? 0.85 : undefined));
          folder?.file(`${baseName}.${fmt}`, blob);
        };
        if (downloadAllFormat === 'both') { await addFormat('png'); await addFormat('webp'); }
        else { await addFormat(downloadAllFormat); }
      }));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(zipBlob); a.download = 'VeraLooks-Photos.zip';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setShowDownloadTip(true);
    } catch { alert('Download All failed. Please download images individually.'); }
    finally { setIsDownloadingAll(false); }
  };

  const aspectClass = getAspectClass(selectedImage?.aspectRatio);
  const originalCount = displayImages.filter(img => !img.styleName.includes('(Edited)') && !img.styleName.includes('(Regenerated)') && !img.styleName.includes('(Erased)')).length;

  // ── Inline style helpers ──────────────────────────────────────────────────
  const btnBase = (bg: string, border: string, color: string, disabled?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: T.sans, transition: 'all 0.15s',
    background: bg, border: `1px solid ${border}`, color, opacity: disabled ? 0.4 : 1,
  });

  return (
    <div style={{ width: '100%', maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px', fontFamily: T.sans }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px', borderRadius: 100, background: T.tealDim, border: `1px solid ${T.tealBorder}`, color: T.teal }}>
            Step 4 of 4
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 400, color: T.white, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Your brand images<br />
              <em style={{ color: T.purple }}>are ready.</em>
            </h1>
            <p style={{ fontSize: 15, fontWeight: 300, color: T.white40, margin: 0 }}>
              {displayImages.length} image{displayImages.length !== 1 ? 's' : ''} generated. Select one to download or refine.
            </p>
          </div>
          <button
            type="button" onClick={onGenerateMore || onRestart}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: T.panel, border: `1px solid ${T.panelBorder}`, color: T.white60 }}
            onMouseOver={e => (e.currentTarget.style.background = T.panelHover)}
            onMouseOut={e => (e.currentTarget.style.background = T.panel)}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />Create New Look
          </button>
        </div>
      </div>

      {/* Success banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 12, marginBottom: 32, background: T.tealDim, border: `1px solid ${T.tealBorder}` }}>
        <CheckCircle style={{ width: 18, height: 18, color: T.teal, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: T.teal, margin: 0 }}>
          Generation complete — download your images before closing this tab.
        </p>
      </div>

      {/* ── Main two-column grid ── */}
      <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div>
          {/* Large preview */}
          <div style={{ borderRadius: 20, overflow: 'hidden', background: T.panel, border: `1px solid ${T.panelBorder}`, padding: 12, marginBottom: 12 }}>
            {selectedImage ? (
              <div className={`relative ${aspectClass}`} style={{ borderRadius: 12, overflow: 'hidden', background: '#0D0F16' }}>
                <img src={selectedImage.imageUrl} alt="Selected" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
            ) : (
              <div style={{ aspectRatio: '1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0F16', border: `2px dashed ${T.panelBorder}` }}>
                <ImageIcon style={{ width: 48, height: 48, color: T.white20 }} />
              </div>
            )}
          </div>

          {selectedImage && (
            <p style={{ fontSize: 12, color: T.white40, textAlign: 'center', marginBottom: 16, letterSpacing: '0.02em' }}>
              {selectedImage.styleName}
            </p>
          )}

          {/* Edit panel */}
          {selectedImage && (
            <div>
              {!isEditPanelOpen ? (
                <button
                  type="button"
                  onClick={() => { setIsEditPanelOpen(true); setEditMode('presets'); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans, background: T.purpleGrad, border: '1px solid rgba(76,29,149,0.6)', color: T.white, boxShadow: '0 4px 20px rgba(46,16,101,0.4)' }}
                >
                  <Wand2 style={{ width: 16, height: 16 }} />Refine This Image
                </button>
              ) : (
                <div style={{ borderRadius: 16, border: `1px solid ${T.panelBorder}`, background: '#0D0F16' }}>
                  {/* Panel header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${T.panelBorder}`, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <ModeTab active={editMode === 'presets'} onClick={() => setEditMode('presets')} icon={<Wand2 style={{ width: 12, height: 12 }} />} label="Edit / Enhance" />
                      <ModeTab active={editMode === 'regenAll'} onClick={() => { setEditMode('regenAll'); setRegenAllError(null); }} icon={<Zap style={{ width: 12, height: 12 }} />} label="Regenerate All" />
                      <ModeTab active={editMode === 'eraser'} onClick={() => setEditMode('eraser')} icon={<Eraser style={{ width: 12, height: 12 }} />} label="Magic Eraser" />
                    </div>
                    <button type="button" onClick={() => { setIsEditPanelOpen(false); setEditError(null); setEditPrompt(''); setSelectedPreset(null); setEditMode('presets'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.white40, padding: 4, display: 'flex' }}>
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>

                  <div style={{ padding: 20 }}>

                    {/* PRESETS MODE */}
                    {editMode === 'presets' && (
                      <>
                        <div style={{ fontSize: 12, color: T.white40, padding: '10px 14px', borderRadius: 10, background: T.panel, border: `1px solid ${T.panelBorder}`, marginBottom: 16, lineHeight: 1.7 }}>
                          <span style={{ color: T.white60, fontWeight: 600 }}>Tip:</span> Use <strong style={{ color: T.white60 }}>Apply Edit</strong> for lighting, background & color. Use <strong style={{ color: T.white60 }}>Regenerate</strong> for body shape — re-runs from your original photos. <span style={{ color: T.amber, fontWeight: 600 }}>Each edit uses 1 credit.</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {EDIT_CATEGORIES.map(cat => (
                            <div key={cat.category} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.panelBorder}` }}>
                              <button type="button" onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: T.panel, border: 'none', cursor: 'pointer', fontFamily: T.sans }}>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber }}>{cat.category}</span>
                                {expandedCategory === cat.category ? <ChevronUp style={{ width: 13, height: 13, color: T.white40 }} /> : <ChevronDown style={{ width: 13, height: 13, color: T.white40 }} />}
                              </button>
                              {expandedCategory === cat.category && (
                                <div style={{ padding: '10px 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  {cat.presets.map(preset => (
                                    <PresetPill key={preset.label} active={selectedPreset?.label === preset.label} onClick={() => handleSelectPreset(preset)} isRegen={preset.mode === 'regenerate'} label={preset.label} />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {selectedPreset && (
                          <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 14, lineHeight: 1.6, background: selectedPreset.mode === 'regenerate' ? T.purpleDim : T.tealDim, border: `1px solid ${selectedPreset.mode === 'regenerate' ? T.purpleBorder : T.tealBorder}`, color: selectedPreset.mode === 'regenerate' ? T.purple : T.teal }}>
                            {selectedPreset.mode === 'regenerate'
                              ? <><span style={{ fontWeight: 600 }}>⚡ Deep regeneration.</span> Click "Regenerate" — re-runs from your original reference photos.</>
                              : <><span style={{ fontWeight: 600 }}>✓ Surface edit.</span> Click "Apply Edit" for this change.</>}
                          </div>
                        )}

                        <div style={{ marginBottom: 14 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: '0 0 8px' }}>Custom instruction (optional)</p>
                          <textarea
                            value={editPrompt}
                            onChange={e => { setEditPrompt(e.target.value); setSelectedPreset(null); }}
                            placeholder="Describe your edit with specific visual detail…"
                            rows={3}
                            style={{ width: '100%', boxSizing: 'border-box', resize: 'none', padding: '12px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.6, fontFamily: T.sans, background: T.panel, border: `1px solid ${T.panelBorder}`, color: T.white80, outline: 'none' }}
                            onFocus={e => (e.currentTarget.style.borderColor = T.purple)}
                            onBlur={e => (e.currentTarget.style.borderColor = T.panelBorder)}
                          />
                        </div>

                        {editError && <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: T.amberDim, border: `1px solid ${T.amberBorder}`, color: T.amber }}>{editError}</div>}

                        <div style={{ fontSize: 12, color: T.white40, padding: '9px 13px', borderRadius: 9, background: T.panel, border: `1px solid ${T.panelBorder}`, marginBottom: 10, lineHeight: 1.6 }}>
                          <span style={{ color: T.amber, fontWeight: 600 }}>Credits remaining: {credits}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="button" onClick={handleApplyEdit} disabled={!editPrompt.trim() || isRefining || credits < 1}
                            style={{ ...btnBase(T.panel, T.panelBorder, T.white60, !editPrompt.trim() || isRefining || credits < 1), flex: 1 }}>
                            {isRefining ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Working…</> : <><Wand2 style={{ width: 14, height: 14 }} />Apply Edit</>}
                          </button>
                          <button type="button" onClick={handleRegenerate} disabled={!editPrompt.trim() || isRefining || credits < 1}
                            style={{ ...btnBase(T.panel, T.panelBorder, T.white60, !editPrompt.trim() || isRefining || credits < 1), flex: 1 }}>
                            {isRefining ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Working…</> : <><RefreshCw style={{ width: 14, height: 14 }} />Regenerate</>}
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: T.white20, textAlign: 'center', marginTop: 10 }}>
                          <strong style={{ color: T.white40 }}>Apply Edit</strong> — fast surface changes. <strong style={{ color: T.white40 }}>Regenerate</strong> — rebuilds from reference photos.
                        </p>
                      </>
                    )}

                    {/* REGENERATE ALL MODE */}
                    {editMode === 'regenAll' && (
                      <>
                        <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: T.purpleDim, border: `1px solid ${T.purpleBorder}`, color: T.purple, lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 600 }}>Applies one instruction to all {originalCount} original image{originalCount !== 1 ? 's' : ''}.</span> Regenerated copies appear after each original. Uses <span style={{ fontWeight: 600 }}>{originalCount} credit{originalCount !== 1 ? 's' : ''}</span>. You have <span style={{ fontWeight: 600 }}>{credits} credit{credits !== 1 ? 's' : ''}</span> remaining.
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: '0 0 8px' }}>Quick presets</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {REGEN_ALL_PRESETS.map(preset => <PresetPill key={preset.label} active={regenAllPreset?.label === preset.label} onClick={() => { setRegenAllPreset(preset); setRegenAllPrompt(preset.prompt); }} isRegen label={preset.label} />)}
                          </div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: '0 0 8px' }}>Or describe your instruction</p>
                          <textarea value={regenAllPrompt} onChange={e => { setRegenAllPrompt(e.target.value); setRegenAllPreset(null); }} placeholder="e.g. Slimmer build. Or: natural daylight on every image…" rows={3}
                            style={{ width: '100%', boxSizing: 'border-box', resize: 'none', padding: '12px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.6, fontFamily: T.sans, background: T.panel, border: `1px solid ${T.panelBorder}`, color: T.white80, outline: 'none' }}
                            onFocus={e => (e.currentTarget.style.borderColor = T.purple)} onBlur={e => (e.currentTarget.style.borderColor = T.panelBorder)} />
                        </div>
                        {regenAllError && <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: T.amberDim, border: `1px solid ${T.amberBorder}`, color: T.amber }}>{regenAllError}</div>}
                        {isRegenAll && regenAllProgress && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.white40, marginBottom: 8 }}>
                              <span>Regenerating {regenAllProgress.current} of {regenAllProgress.total}…</span>
                              <span>{Math.round((regenAllProgress.current / regenAllProgress.total) * 100)}%</span>
                            </div>
                            <div style={{ height: 3, borderRadius: 100, background: T.panel, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 100, transition: 'width 0.5s ease', width: `${(regenAllProgress.current / regenAllProgress.total) * 100}%`, background: T.purpleGrad }} />
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 10 }}>
                          {isRegenAll
                            ? <button type="button" onClick={() => { regenAllCancelRef.current = true; }} style={{ flex: 1, ...btnBase(T.redDim, T.redBorder, T.red) }}><X style={{ width: 14, height: 14 }} />Cancel</button>
                            : <button type="button" onClick={handleRegenAll} disabled={!regenAllPrompt.trim() || !originalCount || credits < originalCount} style={{ flex: 1, ...btnBase(T.purpleGrad, 'rgba(76,29,149,0.6)', T.white, !regenAllPrompt.trim() || !originalCount || credits < originalCount), boxShadow: '0 4px 16px rgba(46,16,101,0.3)' }}><Zap style={{ width: 14, height: 14 }} />Regenerate All {originalCount} Image{originalCount !== 1 ? 's' : ''}</button>}
                        </div>
                        <p style={{ fontSize: 11, color: T.white20, textAlign: 'center', marginTop: 10 }}>Results appear one by one. You can cancel at any time.</p>
                      </>
                    )}

                    {/* MAGIC ERASER MODE */}
                    {editMode === 'eraser' && (
                      <>
                        <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: T.amberDim, border: `1px solid ${T.amberBorder}`, color: T.amber, lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 600 }}>Paint over anything you want removed.</span> Works best on discrete objects like signs, poles, or people in the background. <span style={{ fontWeight: 600 }}>Uses 1 credit.</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.white40, whiteSpace: 'nowrap' }}>Brush size</span>
                          <input type="range" min={8} max={60} step={2} value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} style={{ flex: 1, accentColor: T.purple }} />
                          <span style={{ fontSize: 12, color: T.white40, width: 24 }}>{brushSize}</span>
                        </div>
                        <div className={`relative ${aspectClass}`} style={{ width: '100%', borderRadius: 12, overflow: 'hidden', border: `2px solid ${T.purpleBorder}`, background: '#0D0F16', cursor: 'crosshair', marginBottom: 14 }}>
                          {selectedImage && <img src={selectedImage.imageUrl} alt="Erase target" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />}
                          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.7, touchAction: 'none' }}
                            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                        </div>
                        {editError && <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: T.amberDim, border: `1px solid ${T.amberBorder}`, color: T.amber }}>{editError}</div>}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="button" onClick={clearMask} disabled={!hasMask || isRefining}
                            style={btnBase(T.panel, T.panelBorder, T.white40, !hasMask || isRefining)}>Clear</button>
                          <button type="button" onClick={handleApplyErase} disabled={!hasMask || isRefining || credits < 1}
                            style={{ flex: 1, ...btnBase(T.tealDim, T.tealBorder, T.teal, !hasMask || isRefining || credits < 1) }}>
                            {isRefining ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Erasing…</> : <><Eraser style={{ width: 14, height: 14 }} />Erase & Fill</>}
                          </button>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Download */}
          <div style={{ borderRadius: 16, border: `1px solid ${T.panelBorder}`, background: T.panel, padding: 20 }}>
            <p style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 400, color: T.white, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download style={{ width: 18, height: 18, color: T.purple }} />Download
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" onClick={() => selectedImage && downloadImage(selectedImage.imageUrl, 'png')} disabled={!selectedImage}
                style={{ ...btnBase(T.purpleGrad, 'rgba(76,29,149,0.6)', T.white, !selectedImage), boxShadow: '0 4px 20px rgba(46,16,101,0.4)' }}>
                <FileDown style={{ width: 16, height: 16 }} />Download Hi-Res PNG
              </button>
              <button type="button" onClick={() => selectedImage && downloadImage(selectedImage.imageUrl, 'webp')} disabled={!selectedImage}
                style={btnBase(T.panel, T.panelBorder, T.white60, !selectedImage)}>
                <Download style={{ width: 16, height: 16 }} />Download Web WebP
              </button>

              {/* Format selector for Download All */}
              <div style={{ padding: '10px 12px', borderRadius: 10, background: T.panel, border: `1px solid ${T.panelBorder}` }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: '0 0 8px' }}>Download All — Format</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['png', 'webp', 'both'] as const).map(fmt => (
                    <button key={fmt} type="button" onClick={() => setDownloadAllFormat(fmt)}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: T.sans, transition: 'all 0.15s', textTransform: 'uppercase' as const, letterSpacing: '0.04em', background: downloadAllFormat === fmt ? T.purpleGrad : T.panel, border: `1px solid ${downloadAllFormat === fmt ? 'rgba(76,29,149,0.6)' : T.panelBorder}`, color: downloadAllFormat === fmt ? T.white : T.white40 }}>
                      {fmt === 'both' ? 'Both' : fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: T.white20, margin: '6px 0 0', lineHeight: 1.5 }}>
                  {downloadAllFormat === 'png' ? 'Hi-res PNG — best for print & editing' : downloadAllFormat === 'webp' ? 'Smaller file size, great for web' : 'Both formats included in the ZIP'}
                </p>
              </div>

              <button type="button" onClick={handleDownloadAll} disabled={!displayImages.length || isDownloadingAll}
                style={btnBase(T.tealDim, T.tealBorder, T.teal, !displayImages.length || isDownloadingAll)}>
                {isDownloadingAll ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />Zipping…</> : <><Archive style={{ width: 16, height: 16 }} />Download All ({displayImages.length})</>}
              </button>
            </div>

            {showDownloadTip && (
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: T.panel, border: `1px solid ${T.panelBorder}`, fontSize: 12, color: T.white40, lineHeight: 1.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: T.white60, marginBottom: 6 }}>
                  <Info style={{ width: 13, height: 13 }} /> How to open your ZIP
                </div>
                <p style={{ margin: '0 0 3px' }}><strong style={{ color: T.white60 }}>Mac:</strong> Double-click in Finder.</p>
                <p style={{ margin: '0 0 3px' }}><strong style={{ color: T.white60 }}>Windows:</strong> Right-click → "Extract All".</p>
                <p style={{ margin: '0 0 3px' }}><strong style={{ color: T.white60 }}>iPhone:</strong> Tap in Files app.</p>
                <p style={{ margin: '0 0 8px' }}><strong style={{ color: T.white60 }}>Android:</strong> Open with Files app.</p>
                <button type="button" onClick={() => setShowDownloadTip(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.teal, fontSize: 12, padding: 0 }}>Got it</button>
              </div>
            )}
            <p style={{ fontSize: 11, color: T.white20, textAlign: 'center', marginTop: 12 }}>Standard commercial license included.</p>
          </div>

          {/* Thumbnail gallery */}
          <div style={{ borderRadius: 16, border: `1px solid ${T.panelBorder}`, background: T.panel, padding: 20 }}>
            <p style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 400, color: T.white, margin: '0 0 14px' }}>
              All Images <span style={{ fontSize: 14, color: T.white40 }}>({displayImages.length})</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {displayImages.map((img, idx) => (
                <button key={img.id} type="button" onClick={() => setSelectedImage(img)}
                  style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: `2px solid ${selectedImage?.id === img.id ? T.purple : 'transparent'}`, boxShadow: selectedImage?.id === img.id ? `0 0 0 2px ${T.purpleBorder}` : 'none', cursor: 'pointer', background: T.panel, padding: 0, transition: 'all 0.15s' }}>
                  <img src={img.imageUrl} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {img.styleName?.includes('(Edited)') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(76,29,149,0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '3px 0', letterSpacing: '0.06em' }}>EDITED</div>}
                  {img.styleName?.includes('(Regenerated)') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(76,29,149,0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '3px 0', letterSpacing: '0.06em' }}>REGEN</div>}
                  {img.styleName?.includes('(Erased)') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(13,148,136,0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '3px 0', letterSpacing: '0.06em' }}>ERASED</div>}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .results-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
};

export default ResultsStep;
