import React, { useState, useEffect } from 'react';
import { UploadStep } from './components/UploadStep';
import { PaymentStep } from './components/PaymentStep';
import { SettingsStep } from './components/SettingsStep';
import { ProcessingStep } from './components/ProcessingStep';
import ResultsStep from './components/ResultsStep';
import { AuthScreen } from './components/AuthScreen';
import ShotListGenerator from './components/ShotListGenerator';
import { useAuth } from './api/useAuth';
import { loadCreditsForUser, saveCreditsForUser } from './api/userCreditsService';
import { loadImagesForUser, saveImagesForUser, deleteImageForUser } from './api/generatedImagesService';
import { 
  GenerationConfig, 
  GeneratedImage, 
  StyleOption, 
  MultiReferenceSet,
  ReferenceImage,
} from './types';
import { generateBrandPhotoWithRefsSafe } from './services/geminiService';
import { AlertCircle, LogOut, Zap, X } from 'lucide-react';

// @ts-ignore
import { BRAND_DEFINITIONS } from './data/brandDefinitions';

export const DEFAULT_CONFIG: GenerationConfig = {
  clothing: 'Business Casual',
  backgroundType: 'Modern Office',
  aspectRatio: '1:1',
  framing: 'Waist Up',
  cameraAngle: 'Eye Level',
  mood: 'Polished Professional',
  lighting: 'Pro Studio',
  retouchLevel: 'None',
  variationsCount: 1,
  clothingColor: 'Neutral',
  brandColor: '',
  secondaryBrandColor: '',
  keepGlasses: true,
  blackAndWhite: false,
  signatureStudio: false,
};

const STEP_LABELS = ['Photos', 'Design', 'Generate', 'Results'];

const PENDING_GEN_KEY   = 'veralooks_pending_generation';
const ABOUT_YOU_KEY     = 'vl_about_you';
const LOW_CREDITS_THRESHOLD = 10;

const loadAboutYou = (): Partial<GenerationConfig> => {
  try {
    const saved = localStorage.getItem(ABOUT_YOU_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};
const REF_IMAGES_KEY    = 'veralooks_ref_images';

// Top-up pack definitions — ~10-12% discount vs original per-credit prices
const TOPUP_PACKS = [
  {
    id: 'topup_starter',
    name: 'Starter Pack',
    credits: 40,
    price: 44,
    originalPrice: 49,
    saving: 5,
    stripeUrl: 'https://link.contentcreatormachine.com/payment-link/69b58e03a42ad4304da7a7f5',
    highlight: false,
    badge: null,
  },
  {
    id: 'topup_pro',
    name: 'Professional Pack',
    credits: 120,
    price: 69,
    originalPrice: 79,
    saving: 10,
    stripeUrl: 'https://link.contentcreatormachine.com/payment-link/69b591e08e8f54b6315372e4',
    highlight: true,
    badge: 'Best Value',
  },
  {
    id: 'topup_brand',
    name: 'Brand Kit Pack',
    credits: 300,
    price: 99,
    originalPrice: 119,
    saving: 20,
    stripeUrl: 'https://link.contentcreatormachine.com/payment-link/69b592188e8f54b6315372e5',
    highlight: false,
    badge: null,
  },
];

// Compress a base64 image to target size in MB
const compressBase64 = (base64: string, targetMB = 0.4): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const MAX_DIM = 1200;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      let quality = 0.7;
      const tryCompress = () => {
        canvas.toBlob(blob => {
          if (!blob) { resolve(base64); return; }
          if (blob.size <= targetMB * 1024 * 1024 || quality < 0.2) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(base64);
            reader.readAsDataURL(blob);
          } else {
            quality -= 0.1;
            tryCompress();
          }
        }, 'image/jpeg', quality);
      };
      tryCompress();
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

const saveRefImagesToStorage = async (images: MultiReferenceSet): Promise<void> => {
  try {
    const compressed: Record<string, any> = {};
    for (const [role, img] of Object.entries(images)) {
      if (img?.base64) {
        const compressedBase64 = await compressBase64(img.base64, 0.4);
        compressed[role] = { ...img, base64: compressedBase64 };
      }
    }
    localStorage.setItem(REF_IMAGES_KEY, JSON.stringify(compressed));
  } catch (e) {
    console.warn('Could not save reference images to localStorage:', e);
  }
};

const loadRefImagesFromStorage = (): MultiReferenceSet | null => {
  try {
    const saved = localStorage.getItem(REF_IMAGES_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as MultiReferenceSet;
  } catch {
    return null;
  }
};

// ─── Top-Up Modal ────────────────────────────────────────────────────────────
function TopUpModal({ onClose, userEmail, isLowCredits }: {
  onClose: () => void;
  userEmail?: string;
  isLowCredits: boolean;
}) {
  const handleSelectPack = (pack: typeof TOPUP_PACKS[0]) => {
    const url = `${pack.stripeUrl}?prefilled_email=${encodeURIComponent(userEmail || '')}&payment=success&credits=${pack.credits}&tier=${pack.id}`;
    window.location.href = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0D0F17', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between">
            <div>
              {isLowCredits && (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 text-xs font-medium"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
                >
                  <span>⚠</span> Running low on credits
                </div>
              )}
              <h2
                className="text-2xl font-medium mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: '#fff' }}
              >
                Top up your credits
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Save 10–12% when you top up — a thank-you for coming back.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all hover:opacity-70"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Packs */}
        <div className="p-8 grid grid-cols-3 gap-4">
          {TOPUP_PACKS.map(pack => (
            <button
              key={pack.id}
              onClick={() => handleSelectPack(pack)}
              className="relative flex flex-col rounded-xl p-5 text-left transition-all hover:scale-[1.02]"
              style={{
                background: pack.highlight ? 'linear-gradient(135deg, rgba(76,29,149,0.3), rgba(124,58,237,0.15))' : 'rgba(255,255,255,0.03)',
                border: pack.highlight ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {pack.badge && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #9F67FF)', color: '#fff', whiteSpace: 'nowrap' }}
                >
                  {pack.badge}
                </div>
              )}
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {pack.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-light" style={{ color: '#fff' }}>{pack.credits}</span>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>credits</span>
                </div>
              </div>
              <div className="mt-auto">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xl font-semibold" style={{ color: pack.highlight ? '#B98FFF' : '#fff' }}>
                    ${pack.price}
                  </span>
                  <span className="text-xs line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    ${pack.originalPrice}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(13,148,136,0.9)' }}>
                  Save ${pack.saving}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="px-8 pb-6 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Credits never expire · Secure checkout via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Low-Credits Banner ───────────────────────────────────────────────────────
function LowCreditsBanner({ credits, onTopUp }: { credits: number; onTopUp: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || credits > LOW_CREDITS_THRESHOLD || credits <= 0) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 px-6 py-3 text-sm"
      style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: '#F59E0B' }}>⚠</span>
        <span style={{ color: 'rgba(255,255,255,0.65)' }}>
          You have <strong style={{ color: '#F59E0B' }}>{credits} credits</strong> remaining. Top up to keep creating.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onTopUp}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #9F67FF)', color: '#fff' }}
        >
          <Zap style={{ width: 11, height: 11 }} />
          Top Up
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:opacity-60 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

function App() {
  const { user, isLoading, login, logout } = useAuth();

  const [currentStep, setCurrentStep] = useState<'upload' | 'settings' | 'payment' | 'results' | 'shotlist'>('upload');
  const [credits, setCredits] = useState(0);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showZeroCreditsModal, setShowZeroCreditsModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{ styles: StyleOption[], config: GenerationConfig } | null>(null);
  const [referenceImages, setReferenceImages] = useState<MultiReferenceSet>({});
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>({ ...DEFAULT_CONFIG, ...loadAboutYou() });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync credits when user loads — Base44 entity first, localStorage fallback
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setCreditsLoaded(true);
      return;
    }

    // STEP 1: Show localStorage credits immediately so UI is responsive
    const stored = localStorage.getItem('veralooks_credits');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setCredits(parsed);
        setCreditsLoaded(true);
      }
    }

    // STEP 2: Load from Base44 entity (authoritative source, works across devices)
    loadCreditsForUser(user.id).then(b44Credits => {
      if (b44Credits !== null) {
        const storedNow = parseInt(localStorage.getItem('veralooks_credits') || '0', 10);
        const best = Math.max(b44Credits, storedNow);
        setCredits(best);
        localStorage.setItem('veralooks_credits', best.toString());
        console.log('[Credits] Loaded from Base44:', b44Credits, '| local:', storedNow, '| using:', best);
      } else if (!stored) {
        console.log('[Credits] No credits found for user');
      }
      setCreditsLoaded(true);
    });

    // STEP 3: Load persisted generated images (90-day gallery)
    loadImagesForUser(user.id).then(saved => {
      if (saved.length > 0) {
        setGeneratedImages(saved);
        console.log('[Images] Restored', saved.length, 'saved images for user');
      }
    });
  }, [user, isLoading]);

  // Handle Stripe payment return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const creditsParam = urlParams.get('credits');

    if (payment === 'success' && creditsParam) {
      const purchasedCredits = parseInt(creditsParam, 10);
      const currentStored = parseInt(localStorage.getItem('veralooks_credits') || '0', 10);
      const newCredits = currentStored + purchasedCredits;
      console.log('[Credits] Stripe return — adding', purchasedCredits, 'credits to', currentStored, '=', newCredits);
      setCredits(newCredits);
      localStorage.setItem('veralooks_credits', newCredits.toString());
      if (user) saveCreditsForUser(user.id, user.email, newCredits);
      window.history.replaceState({}, '', window.location.pathname);

      const restoredImages = loadRefImagesFromStorage();
      if (restoredImages && Object.keys(restoredImages).length > 0) {
        setReferenceImages(restoredImages);
        localStorage.removeItem(REF_IMAGES_KEY);
      }

      const savedPending = localStorage.getItem(PENDING_GEN_KEY);
      if (savedPending) {
        try {
          const restored = JSON.parse(savedPending);
          localStorage.removeItem(PENDING_GEN_KEY);
          setPendingGeneration(restored);
          executeGeneration(restored.styles, restored.config, newCredits, restoredImages || {});
        } catch {
          localStorage.removeItem(PENDING_GEN_KEY);
          setCurrentStep('settings');
        }
      } else {
        setCurrentStep('settings');
      }
    }
  }, []);

  const handleGoHome = () => {
    setCurrentStep('upload');
    window.scrollTo(0, 0);
  };

  const handleReferenceUpdate = (newImages: MultiReferenceSet) => {
    setReferenceImages(newImages);
  };

  // Auto-save reference images whenever they change — so navigating away never loses them
  useEffect(() => {
    if (Object.keys(referenceImages).length > 0) {
      saveRefImagesToStorage(referenceImages);
    }
  }, [referenceImages]);

  // Restore reference images on app load (if no Stripe return already handled it)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isStripeReturn = urlParams.get('payment') === 'success';
    if (!isStripeReturn) {
      const saved = loadRefImagesFromStorage();
      if (saved && Object.keys(saved).length > 0) {
        setReferenceImages(saved);
        console.log('[RefImages] Restored from storage on load');
      }
    }
  }, []);

  const handleUploadContinue = () => {
    setCurrentStep('settings');
    window.scrollTo(0, 0);
  };

  const handleConfigChange = (newConfig: GenerationConfig) => {
    setGenerationConfig(newConfig);
    if (newConfig.genderPresentation || newConfig.ageRange || newConfig.hairColor) {
      try {
        localStorage.setItem('vl_about_you', JSON.stringify({
          genderPresentation: newConfig.genderPresentation,
          ageRange: newConfig.ageRange,
          hairColor: newConfig.hairColor,
          includeRing: newConfig.includeRing,
        }));
      } catch {}
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
  };

  const handleGenerateRequest = async (styles: StyleOption[], config: GenerationConfig) => {
    const totalImagesRequested = styles.reduce((sum, style) => sum + (style.imageCount || 1), 0);
    console.log('[VeraLooks] Generate request — credits:', credits, '| loaded:', creditsLoaded, '| requested:', totalImagesRequested);
    if (creditsLoaded && credits < totalImagesRequested) {
      const pending = { styles, config };
      setPendingGeneration(pending);
      localStorage.setItem(PENDING_GEN_KEY, JSON.stringify(pending));
      await saveRefImagesToStorage(referenceImages);

      // New users (never generated before) go to the Payment step for full-price purchase.
      // Existing users who've run out of credits see the discounted top-up modal.
      if (generatedImages.length === 0) {
        setCurrentStep('payment');
      } else {
        setShowTopUpModal(true);
      }
      return;
    }
    if (!creditsLoaded) {
      console.warn('[VeraLooks] Credits not yet loaded — waiting before routing');
      return;
    }
    await executeGeneration(styles, config, credits, referenceImages);
  };

  const executeGeneration = async (
    styles: StyleOption[],
    config: GenerationConfig,
    creditOverride?: number,
    refOverride?: MultiReferenceSet
  ) => {
    setIsGenerating(true);
    setError(null);
    const newImages: GeneratedImage[] = [];
    let globalImageIndex = 0;
    let currentCredits = creditOverride ?? credits;
    const refsToUse = refOverride ?? referenceImages;

    // Guard: if no reference photo, send back to upload with a friendly message
    if (!refsToUse?.main?.base64) {
      setIsGenerating(false);
      setCurrentStep("upload");
      window.scrollTo(0, 0);
      setTimeout(() => setError("We could not find your reference photo — please re-upload it to continue."), 300);
      return;
    }

    try {
      for (const style of styles) {
        const countForThisLook = style.imageCount || 1;
        const finalConfigForThisLook: GenerationConfig = {
          ...config,
          ...(style.overrides || {}),
        };

        for (let i = 0; i < countForThisLook; i++) {
          setLoadingMessage(`Generating: ${style.name} (Image ${i + 1} of ${countForThisLook})...`);

          const isExpertMode = !!finalConfigForThisLook.expertPrompt?.trim();
          const fullPrompt = isExpertMode
            ? finalConfigForThisLook.expertPrompt!.trim()
            : `${finalConfigForThisLook.clothing}, ${finalConfigForThisLook.backgroundType || "in a professional corporate setting"}`;

          let imageUrl: string | null = null;
          try {
            imageUrl = await generateBrandPhotoWithRefsSafe(
              refsToUse,
              fullPrompt,
              finalConfigForThisLook,
              undefined,
              globalImageIndex
            );
          } catch (imgErr: any) {
            console.warn(`Image failed for ${style.name} #${i + 1}:`, imgErr.message);
            globalImageIndex++;
            continue;
          }

          if (!imageUrl) {
            globalImageIndex++;
            continue;
          }

          currentCredits = Math.max(0, currentCredits - 1);
          setCredits(currentCredits);
          localStorage.setItem('veralooks_credits', currentCredits.toString());
          if (user) saveCreditsForUser(user.id, user.email, currentCredits);

          newImages.push({
            id: Date.now().toString() + Math.random().toString(),
            originalUrl: imageUrl,
            imageUrl: imageUrl,
            styleName: `${style.name} ${i + 1}`,
            styleId: style.id,
            createdAt: Date.now(),
            aspectRatio: finalConfigForThisLook.aspectRatio || '1:1',
            stylePrompt: fullPrompt,
            originalConfig: { ...finalConfigForThisLook },
          });

          globalImageIndex++;
          await new Promise(r => setTimeout(r, 500));
        }
      }

      if (newImages.length > 0) {
        setGeneratedImages(prev => [...newImages, ...prev]);
        setPendingGeneration(null);
        localStorage.removeItem(PENDING_GEN_KEY);
        setCurrentStep('results');
        window.scrollTo(0, 0);
        // Persist new images to Base44 (90-day gallery)
        if (user) {
          saveImagesForUser(user.id, newImages).catch(err =>
            console.warn('[Images] Background save failed:', err)
          );
        }
      } else {
        setError("No images were generated successfully. Please check your reference photo and try again.");
      }
    } catch (err: any) {
      console.error("Generation Error:", err);
      setError(err.message || "Something went wrong during generation. Please try again.");
    } finally {
      setIsGenerating(false);
      setLoadingMessage('');
    }
  };

  const handlePaymentComplete = (purchasedCredits: number) => {
    const newCredits = credits + purchasedCredits;
    setCredits(newCredits);
    localStorage.setItem('veralooks_credits', newCredits.toString());
    if (user) saveCreditsForUser(user.id, user.email, newCredits);
    if (pendingGeneration) {
      executeGeneration(pendingGeneration.styles, pendingGeneration.config, newCredits, referenceImages);
    } else {
      setCurrentStep('settings');
    }
    window.scrollTo(0, 0);
  };

  const handlePaymentBack = () => {
    setCurrentStep('settings');
  };

  const handleReset = () => {
    const savedAboutYou = loadAboutYou();
    setGenerationConfig(prev => ({
      ...DEFAULT_CONFIG,
      genderPresentation: prev.genderPresentation || savedAboutYou.genderPresentation,
      ageRange: prev.ageRange || savedAboutYou.ageRange,
      hairColor: prev.hairColor || savedAboutYou.hairColor,
      includeRing: prev.includeRing ?? savedAboutYou.includeRing,
    }));
    setCurrentStep('settings');
    window.scrollTo(0, 0);
  };

  const handleUpdateImage = (id: string, newUrl: string) => {
    setGeneratedImages(prev => prev.map(img =>
      img.id === id ? { ...img, imageUrl: newUrl } : img
    ));
  };

  const handleSpendCredit = (amount: number) => {
  setCredits(prev => {
    const newCredits = Math.max(0, prev - amount);
    localStorage.setItem('veralooks_credits', newCredits.toString());
    if (user) saveCreditsForUser(user.id, user.email, newCredits);
    return newCredits;
  });
};

  const handleAddCredits = () => {
    setShowZeroCreditsModal(false);
    setZeroCreditsDismissed(true);
    setShowTopUpModal(true);
  };

  const handleGenerateMore = () => {
    setCurrentStep('settings');
    window.scrollTo(0, 0);
  };

  const [zeroCreditsDismissed, setZeroCreditsDismissed] = useState(false);

  // Persisted Shot List description — survives component unmounting
  const [shotListDescription, setShotListDescription] = useState<string>(() => {
    try { return localStorage.getItem('vl_shotlist_description') || ''; } catch { return ''; }
  });
  useEffect(() => {
    // Only show zero-credits modal if the user has previously generated images
    // (i.e. they actually used up credits, not a fresh account with no record yet)
    const hasGeneratedBefore = generatedImages.length > 0;
    if (creditsLoaded && credits <= 0 && !isGenerating && !zeroCreditsDismissed && hasGeneratedBefore) {
      setShowZeroCreditsModal(true);
    }
    // If credits are restored (after top-up), hide the modal and reset dismissed flag
    if (creditsLoaded && credits > 0) {
      setShowZeroCreditsModal(false);
      setZeroCreditsDismissed(false);
    }
  }, [credits, creditsLoaded, isGenerating, generatedImages]);

  const pendingImageCount = pendingGeneration
    ? pendingGeneration.styles.reduce((sum, s) => sum + (s.imageCount || 1), 0)
    : 0;

  const stepNavIndex = isGenerating ? 2
    : currentStep === 'upload'   ? 0
    : currentStep === 'settings' ? 1
    : currentStep === 'results'  ? 3
    : 1;

  return (
    <div className="min-h-screen text-white font-sans flex flex-col" style={{ background: '#080A0F' }}>

      {/* AUTH GATE */}
      {isLoading && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!isLoading && !user && (
        <AuthScreen onLogin={login} />
      )}

      {!isLoading && user && (
        <div className="min-h-screen flex flex-col">

          {/* HEADER */}
          <header
            className="border-b sticky top-0 z-40 shrink-0 backdrop-blur-xl"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,10,15,0.92)' }}
          >
            <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">

              <button
                onClick={handleGoHome}
                className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
                aria-label="VeraLooks Home"
              >
                <img src="/VeraLooks_logo_white.png" alt="VeraLooks" style={{ height: 28, width: 'auto' }} />
              </button>

              <div className="hidden md:flex items-center gap-1.5">
                {STEP_LABELS.map((label, i) => {
                  const isActive   = i === stepNavIndex;
                  const isComplete = i < stepNavIndex;
                  return (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold transition-all"
                          style={{
                            background: isActive   ? 'linear-gradient(135deg, #2E1065, #4C1D95)'
                                      : isComplete ? 'rgba(13,148,136,0.2)'
                                      :              'rgba(255,255,255,0.05)',
                            color:     isActive   ? '#fff'
                                      : isComplete ? '#0D9488'
                                      :              'rgba(255,255,255,0.25)',
                            border:    isComplete ? '1px solid rgba(13,148,136,0.35)'
                                      : isActive  ? 'none'
                                      :             '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {isComplete ? '✓' : i + 1}
                        </div>
                        <span
                          className="text-[9px] uppercase tracking-wider"
                          style={{
                            fontWeight: isActive ? 600 : 400,
                            color: isActive   ? 'rgba(159,103,255,0.9)'
                                 : isComplete ? 'rgba(13,148,136,0.65)'
                                 :              'rgba(255,255,255,0.2)',
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      {i < STEP_LABELS.length - 1 && (
                        <div
                          className="w-8 h-px mb-3.5"
                          style={{ background: isComplete ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.07)' }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                
                {/* Your Images button */}
                {generatedImages.length > 0 && (
                  <button
                    onClick={() => { setCurrentStep('results'); window.scrollTo(0, 0); }}
                    className="hidden md:flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all hover:opacity-80"
                    style={{
                      background: currentStep === 'results' ? 'rgba(76,29,149,0.2)' : 'rgba(255,255,255,0.04)',
                      border: currentStep === 'results' ? '1px solid rgba(76,29,149,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span style={{ fontSize: 13, color: currentStep === 'results' ? '#B98FFF' : 'rgba(255,255,255,0.4)' }}>
                      ✦ Your Images
                    </span>
                  </button>
                )}

                {/* Credits button — clickable to open top-up modal */}
                <button
                  onClick={handleAddCredits}
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all hover:opacity-80"
                  style={{
                    background: credits <= LOW_CREDITS_THRESHOLD && credits > 0
                      ? 'rgba(245,158,11,0.12)'
                      : 'rgba(76,29,149,0.15)',
                    border: credits <= LOW_CREDITS_THRESHOLD && credits > 0
                      ? '1px solid rgba(245,158,11,0.35)'
                      : '1px solid rgba(76,29,149,0.3)',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: credits <= LOW_CREDITS_THRESHOLD && credits > 0 ? '#F59E0B' : '#9F67FF' }}
                  />
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: credits <= LOW_CREDITS_THRESHOLD && credits > 0 ? '#F59E0B' : 'rgba(255,255,255,0.75)' }}
                  >
                    {credits} Credits
                  </span>
                </button>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <LogOut style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />
                </button>
              </div>
            </div>

            {/* Low-credits warning banner — shown below header */}
            <LowCreditsBanner credits={credits} onTopUp={handleAddCredits} />
          </header>

          {/* ERROR MODAL */}
          {error && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <div
                className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
                style={{ background: '#0D0F16', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-300 mb-1">{error.includes('reference photo') ? 'Photo Required' : 'Generation Error'}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setError(null); window.scrollTo(0, 0); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => { setError(null); window.scrollTo(0, 0); }}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #2E1065, #4C1D95)' }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TOP-UP MODAL — renders last so it's always on top */}
          {showTopUpModal && (
            <TopUpModal
              onClose={() => setShowTopUpModal(false)}
              userEmail={user?.email}
              isLowCredits={credits <= LOW_CREDITS_THRESHOLD && credits > 0}
            />
          )}

          {/* ZERO CREDITS MODAL */}
          {showZeroCreditsModal && !showTopUpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
              <div
                className="rounded-2xl p-8 max-w-md w-full shadow-2xl text-center relative"
                style={{ background: '#0D0F17', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                <button
                  onClick={() => { setShowZeroCreditsModal(false); setZeroCreditsDismissed(true); }}
                  className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition"
                  style={{ fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
                >
                  <Zap style={{ width: 28, height: 28, color: '#9F67FF' }} />
                </div>
                <h2
                  className="text-2xl font-medium mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: '#fff' }}
                >
                  You're out of credits
                </h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                  Top up to continue creating beautiful brand photos. Save 10–12% when you reload.
                </p>
                <button
                  onClick={handleAddCredits}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #9F67FF)' }}
                >
                  Top Up Credits
                </button>
              </div>
            </div>
          )}

          {/* MAIN */}
          <main className="flex-1 flex flex-col relative">
            {isGenerating ? (
              <ProcessingStep message={loadingMessage} />
            ) : (
              <div className="py-10 w-full">
                {currentStep === 'upload' && (
                  <UploadStep
                    referenceImages={referenceImages}
                    onUpdate={handleReferenceUpdate}
                    onNext={handleUploadContinue}
                  />
                )}
                {currentStep === 'settings' && (
                  <SettingsStep
                    config={generationConfig}
                    credits={credits}
                    creditsLoaded={creditsLoaded}
                    onChange={handleConfigChange}
                    onNext={handleGenerateRequest}
                    onBack={handleBackToUpload}
                  />
                )}
                {currentStep === 'payment' && (
                  <PaymentStep
                    imageCount={pendingImageCount || 20}
                    onPaymentComplete={handlePaymentComplete}
                    onBack={handlePaymentBack}
                    userEmail={user?.email}
                  />
                )}
                 {currentStep === 'results' && (
                  <ResultsStep
                    images={generatedImages}
                    onRestart={handleReset}
                    onGenerateMore={handleGenerateMore}
                    refs={referenceImages}
                    baseConfig={generationConfig}
                    credits={credits}
                    onSpendCredit={handleSpendCredit}
                    onRequestTopUp={handleAddCredits}
                    onDeleteImage={(imageId) => {
                      setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
                      if (user) deleteImageForUser(user.id, imageId).catch(() => {});
                    }}
                  />
                )}
                {currentStep === 'shotlist' && (
                  <ShotListGenerator
                    initialDescription={shotListDescription}
                    onDescriptionChange={setShotListDescription}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
