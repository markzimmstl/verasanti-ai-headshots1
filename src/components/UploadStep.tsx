import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, Check, Camera, Sun, Maximize2, ArrowUpDown, Loader2, RefreshCw, Sparkles, ChevronDown } from 'lucide-react';
import { ReferenceImage, MultiReferenceSet } from '../types.ts';
import { generateConfirmationPhoto, overlayLogoOnConfirmationPhoto, checkPhotoQuality } from '../services/geminiService.ts';

interface UploadStepProps {
  referenceImages: MultiReferenceSet;
  onUpdate: (images: MultiReferenceSet) => void;
  onNext: () => void;
}

const TIPS = [
  { icon: <ArrowUpDown className="w-3 h-3 text-red-400" />, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', titleColor: 'rgba(239,68,68,0.9)', title: 'CRITICAL: Keep camera straight', body: "A tilted camera causes distortion the AI can't correct.", badge: true },
  { icon: <Sun className="w-3 h-3" style={{ color: '#F59E0B' }} />, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', titleColor: 'rgba(255,255,255,0.85)', title: 'Light should shine on your face', body: 'Avoid backlighting. Even natural light works best.' },
  { icon: <Maximize2 className="w-3 h-3" style={{ color: '#9F67FF' }} />, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', titleColor: 'rgba(255,255,255,0.85)', title: 'Fill about half the frame', body: 'Not too distant, not too cropped.' },
  { icon: <Upload className="w-3 h-3" style={{ color: '#0D9488' }} />, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', titleColor: 'rgba(255,255,255,0.85)', title: 'Full-body: lower camera to chest', body: 'Keep it upright so your whole body fits.' },
];

const TipsPanel: React.FC = () => (
  <div style={{ borderRadius: 16, padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <Camera className="w-4 h-4" style={{ color: '#9F67FF' }} />
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 500, color: '#fff' }}>Tips for best results</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {TIPS.map((tip, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: tip.bg, border: `1px solid ${tip.border}` }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, background: tip.bg, border: `1px solid ${tip.border}` }}>{tip.icon}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: tip.titleColor, margin: 0 }}>{tip.title}</p>
              {tip.badge && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '1px 5px', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.9)' }}>Critical</span>}
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{tip.body}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const UploadStep: React.FC<UploadStepProps> = ({ referenceImages, onUpdate, onNext }) => {
  const [error, setError] = useState<string | null>(null);
  const [compressingFile, setCompressingFile] = useState<string | null>(null);
  const [confirmationPhoto, setConfirmationPhoto] = useState<string | null>(null);
  const [isGeneratingConfirmation, setIsGeneratingConfirmation] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (referenceImages.main && !confirmationPhoto && !isGeneratingConfirmation) {
      handleGenerateConfirmation();
    }
  }, [referenceImages.main]);

  const handleGenerateConfirmation = async () => {
    if (!referenceImages.main) return;
    setIsGeneratingConfirmation(true);
    setConfirmationError(null);
    setConfirmationPhoto(null);
    try {
      const rawPhoto = await generateConfirmationPhoto(referenceImages);
      const composited = await overlayLogoOnConfirmationPhoto(rawPhoto, '/VeraLooks_logo_white.png');
      setConfirmationPhoto(composited);
    } catch {
      setConfirmationError('Preview generation failed. You can still continue.');
    } finally {
      setIsGeneratingConfirmation(false);
    }
  };

  const scrollToConfirmation = () => {
    confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const compressImage = (file: File, maxSizeMB: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_DIM = 2400;
          if (width > MAX_DIM || height > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          let quality = 0.85;
          const tryCompress = () => {
            canvas.toBlob(blob => {
              if (!blob) { reject(new Error('Compression failed')); return; }
              if (blob.size <= maxSizeMB * 1024 * 1024 || quality < 0.3) {
                const r2 = new FileReader();
                r2.onload = () => resolve(r2.result as string);
                r2.onerror = reject;
                r2.readAsDataURL(blob);
              } else { quality -= 0.1; tryCompress(); }
            }, 'image/jpeg', quality);
          };
          tryCompress();
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File, role: keyof MultiReferenceSet) => {
    setError(null);
    const COMPRESS_THRESHOLD = 4 * 1024 * 1024;
    const HARD_LIMIT = 30 * 1024 * 1024;
    if (file.size > HARD_LIMIT) { setError('File is too large (over 30MB). Please use a smaller photo.'); return; }
    try {
      let base64: string;
      if (file.size > COMPRESS_THRESHOLD) {
        setCompressingFile(`Optimizing your photo (${(file.size / 1024 / 1024).toFixed(1)}MB)…`);
        base64 = await compressImage(file, 4);
        setCompressingFile(null);
      } else {
        base64 = await processFile(file);
      }
      const newImage: ReferenceImage = { id: Date.now().toString(), fileName: file.name, base64, createdAt: Date.now(), role: role as any };
      onUpdate({ ...referenceImages, [role]: newImage });
      if (role === 'main') {
        setQualityWarnings([]);
        const quality = await checkPhotoQuality(base64);
        if (!quality.passed) setQualityWarnings(quality.warnings);
      }
    } catch {
      setCompressingFile(null);
      setError('Failed to process image. Please try again.');
    }
  };

  const removeImage = (role: keyof MultiReferenceSet) => {
    const newSet = { ...referenceImages };
    delete newSet[role];
    onUpdate(newSet);
    if (role === 'main') { setConfirmationPhoto(null); setConfirmationError(null); }
  };

  const UploadSlot = ({ role, label, subLabel }: { role: keyof MultiReferenceSet; label: string; subLabel?: string }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const image = referenceImages[role];
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
    const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.length) handleFileSelect(e.dataTransfer.files[0], role); };
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) handleFileSelect(e.target.files[0], role); };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
          {label}
          {subLabel && <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{subLabel}</span>}
        </label>
        {image ? (
          <div className="relative group" style={{ aspectRatio: '3/4', width: '100%', overflow: 'hidden', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(13,148,136,0.35)' }}>
            <img src={image.base64} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            <button onClick={e => { e.stopPropagation(); removeImage(role); }} className="absolute top-2.5 right-2.5 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer' }}>
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="absolute bottom-2.5 right-2.5" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)', color: '#0D9488', fontSize: 11, fontWeight: 500 }}>
              <Check className="w-3 h-3" /> Added
            </div>
          </div>
        ) : (
          <div onClick={() => inputRef.current?.click()} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            style={{ aspectRatio: '3/4', width: '100%', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${isDragOver ? 'rgba(76,29,149,0.7)' : 'rgba(255,255,255,0.15)'}`, background: isDragOver ? 'rgba(76,29,149,0.08)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
            <input type="file" ref={inputRef} onChange={onChange} style={{ display: 'none' }} accept="image/jpeg, image/png, image/webp" />
            <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, background: 'rgba(76,29,149,0.15)', border: '1px solid rgba(76,29,149,0.25)' }}>
              <Upload className="w-4 h-4" style={{ color: '#9F67FF' }} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{isDragOver ? 'Drop here' : 'Click or drag photo'}</p>
          </div>
        )}
      </div>
    );
  };

  const photoGridCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)';
  const mainPhotoRowSpan = isMobile ? 'span 1' : 'span 2';
  const layoutCols = isMobile ? '1fr' : '1fr 300px';

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '0 20px' }} className="animate-fade-in">

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: '100px', padding: '4px 12px', marginBottom: 16, background: 'rgba(76,29,149,0.12)', border: '1px solid rgba(76,29,149,0.25)', color: '#B98FFF', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Step 1 of 4
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 32 : 40, fontWeight: 400, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 12, marginTop: 0 }}>
          Upload your reference photos
        </h1>
        <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: 0 }}>
          The AI learns what you look like from these photos. One clear face photo is enough — side angles and full body improve results.
        </p>
      </div>

      {/* Tips — mobile only, shown ABOVE photo slots */}
      {isMobile && (
        <div style={{ marginBottom: 24 }}>
          <TipsPanel />
        </div>
      )}

      {/* Compression status */}
      {compressingFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, marginBottom: 24, background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)', color: '#0D9488', fontSize: 13 }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ flexShrink: 0 }} />
          {compressingFile} We're optimizing it for you automatically.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, marginBottom: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.9)', fontSize: 13 }}>
          <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Quality warnings */}
      {qualityWarnings.length > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 24, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#F59E0B', flexShrink: 0 }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', margin: 0 }}>Photo Quality Notice</p>
          </div>
          {qualityWarnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'rgba(245,158,11,0.85)', marginLeft: 24, marginBottom: 4 }}>{w}</p>)}
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 24, marginBottom: 0 }}>You can still continue — but better quality photos produce better results.</p>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: layoutCols, gap: '32px', alignItems: 'start' }}>

        {/* LEFT — upload slots */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: photoGridCols, gap: '20px', marginBottom: 24 }}>

            {/* Main photo */}
            <div style={{ gridColumn: 'span 2', gridRow: mainPhotoRowSpan, position: 'relative' }}>
              <UploadSlot role="main" label="Main Photo (Required)" subLabel="Face the camera, good lighting, no heavy filters." />
              {!referenceImages.main && (
                <div style={{ position: 'absolute', bottom: -28, left: 0, right: 0, textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', borderRadius: '100px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(239,68,68,0.9)' }}>Required</span>
                </div>
              )}
            </div>

            <UploadSlot role="fullBody" label="Full-Body Photo" subLabel="Optional — head to toe, camera at chest height." />

            {/* AI Preview button */}
            {referenceImages.main ? (
              <button onClick={scrollToConfirmation} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 8px', borderRadius: 12, background: 'rgba(76,29,149,0.08)', border: '1px solid rgba(76,29,149,0.25)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
                {isGeneratingConfirmation ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#9F67FF' }} />
                  : confirmationPhoto ? <Sparkles className="w-5 h-5" style={{ color: '#9F67FF' }} />
                  : <AlertCircle className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />}
                <span style={{ fontSize: 11, lineHeight: 1.4, color: 'rgba(159,103,255,0.9)' }}>
                  {isGeneratingConfirmation ? 'Generating AI preview…' : confirmationPhoto ? 'AI preview ready ↓' : confirmationError ? 'Preview failed ↓' : 'Preparing preview…'}
                </span>
                {(confirmationPhoto || confirmationError) && <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9F67FF' }} />}
              </button>
            ) : <div />}

            <UploadSlot role="sideLeft" label="Your Left Side" subLabel="Optional — turn so your left faces the camera." />
            <UploadSlot role="sideRight" label="Your Right Side" subLabel="Optional — turn so your right faces the camera." />
          </div>
        </div>

        {/* RIGHT — tips (desktop only) + continue */}
        <div style={{ position: isMobile ? 'static' : 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Tips — desktop only */}
          {!isMobile && <TipsPanel />}

          {/* Continue button */}
          <div style={{ borderRadius: 16, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {!referenceImages.main && <p style={{ fontSize: 12, textAlign: 'center', marginBottom: 12, color: 'rgba(255,255,255,0.5)' }}>Upload a photo to continue</p>}
            <button onClick={onNext} disabled={!referenceImages.main}
              style={{ width: '100%', padding: '14px', borderRadius: 11, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", background: referenceImages.main ? 'linear-gradient(135deg, #2E1065, #4C1D95)' : 'rgba(255,255,255,0.04)', color: referenceImages.main ? '#fff' : 'rgba(255,255,255,0.3)', border: referenceImages.main ? 'none' : '1px solid rgba(255,255,255,0.06)', cursor: referenceImages.main ? 'pointer' : 'not-allowed', boxShadow: referenceImages.main ? '0 8px 24px rgba(46,16,101,0.4)' : 'none', transition: 'all 0.2s' }}>
              Next: Design Photoshoot →
            </button>
          </div>
        </div>
      </div>

      {/* AI Confirmation Preview */}
      {referenceImages.main && (
        <div ref={confirmationRef} style={{ marginTop: 48, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0, marginBottom: 4 }}>AI Confirmation Preview</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>A quick preview of how the AI reads your photo — before you design your full shoot.</p>
            </div>
            {!isGeneratingConfirmation && (
              <button onClick={handleGenerateConfirmation} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 24, padding: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Your Photo</p>
              <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '1/1', border: '1px solid rgba(255,255,255,0.07)' }}>
                <img src={referenceImages.main.base64} alt="Your uploaded photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', margin: 0 }}>AI Preview</p>
              <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '1/1', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isGeneratingConfirmation && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '0 16px' }}>
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9F67FF' }} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Generating your preview…</p>
                  </div>
                )}
                {confirmationPhoto && !isGeneratingConfirmation && <img src={confirmationPhoto} alt="AI confirmation preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                {confirmationError && !isGeneratingConfirmation && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', padding: '0 16px' }}>
                    <AlertCircle className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{confirmationError}</p>
                    <button onClick={handleGenerateConfirmation} style={{ fontSize: 12, color: '#9F67FF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}>Try again</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ padding: '0 20px 16px' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>This preview uses a standard VeraLooks studio setup. Your actual generated images will reflect the style, clothing, and scene you choose on the next screen.</p>
          </div>
        </div>
      )}
    </div>
  );
};
