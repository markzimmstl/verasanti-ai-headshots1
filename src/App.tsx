import React, { useState, useEffect } from 'react';
import { UploadStep } from './components/UploadStep';
import { PaymentStep } from './components/PaymentStep';
import { SettingsStep } from './components/SettingsStep';
import { ProcessingStep } from './components/ProcessingStep';
import ResultsStep from './components/ResultsStep';
import { AuthScreen } from './components/AuthScreen';
import { useAuth } from './api/useAuth';
import { 
  GenerationConfig, 
  GeneratedImage, 
  StyleOption, 
  MultiReferenceSet,
  ReferenceImage,
} from './types';
import { generateBrandPhotoWithRefsSafe } from './services/geminiService';
import { AlertCircle, LogOut } from 'lucide-react';

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
};

const STEP_LABELS = ['Photos', 'Design', 'Generate', 'Results'];

const PENDING_GEN_KEY   = 'veralooks_pending_generation';
const ABOUT_YOU_KEY     = 'vl_about_you';

const loadAboutYou = (): Partial<GenerationConfig> => {
  try {
    const saved = localStorage.getItem(ABOUT_YOU_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};
const REF_IMAGES_KEY    = 'veralooks_ref_images';

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
          if (!blob) { resolve(base64); return; } // fallback to original
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
    img.onerror = () => resolve(base64); // fallback to original
    img.src = base64;
  });
};

// Save reference images to localStorage, compressing each to ~400KB
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

// Restore reference images from localStorage
const loadRefImagesFromStorage = (): MultiReferenceSet | null => {
  try {
    const saved = localStorage.getItem(REF_IMAGES_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as MultiReferenceSet;
  } catch {
    return null;
  }
};

function App() {
  const { user, isLoading, login, logout } = useAuth();

  const [currentStep, setCurrentStep] = useState<'upload' | 'settings' | 'payment' | 'results'>('upload');
  const [credits, setCredits] = useState(0);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{ styles: StyleOption[], config: GenerationConfig } | null>(null);
  const [referenceImages, setReferenceImages] = useState<MultiReferenceSet>({});
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>({ ...DEFAULT_CONFIG, ...loadAboutYou() });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  // settingsKey removed — SettingsStep preserves About You fields via generationConfig prop

  // Sync credits when user loads — check Base44 user object AND localStorage fallback
  useEffect(() => {
    // Wait until auth has finished resolving before touching credits
    if (isLoading) return;

    if (!user) {
      // Auth finished, no user — credits=0 is correct, mark as loaded
      setCreditsLoaded(true);
      return;
    }

    // Log user object so we can see what fields Base44 provides
    console.log('[VeraLooks] Base44 user object:', JSON.stringify(user));

    // Base44 may use different field names for credits
    const b44Credits =
      (user as any).creditsBalance ??
      (user as any).credits ??
      (user as any).credit_balance ??
      (user as any).balance ??
      undefined;

    if (b44Credits !== undefined && b44Credits > 0) {
      setCredits(b44Credits);
      localStorage.setItem('veralooks_credits', b44Credits.toString());
    } else {
      // Fallback: restore from localStorage (set after Stripe purchase)
      const stored = localStorage.getItem('veralooks_credits');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setCredits(parsed);
        }
      }
    }
    setCreditsLoaded(true);
  }, [user, isLoading]);

  // Handle Stripe payment return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const creditsParam = urlParams.get('credits');

    if (payment === 'success' && creditsParam && user) {
      const purchasedCredits = parseInt(creditsParam, 10);
      const newCredits = credits + purchasedCredits;
      setCredits(newCredits);
      localStorage.setItem('veralooks_credits', newCredits.toString());
      window.history.replaceState({}, '', window.location.pathname);

      // Restore reference images saved before redirect
      const restoredImages = loadRefImagesFromStorage();
      if (restoredImages && Object.keys(restoredImages).length > 0) {
        setReferenceImages(restoredImages);
        localStorage.removeItem(REF_IMAGES_KEY);
      }

      // Restore pending generation and execute
      const savedPending = localStorage.getItem(PENDING_GEN_KEY);
      if (savedPending) {
        try {
          const restored = JSON.parse(savedPending);
          localStorage.removeItem(PENDING_GEN_KEY);
          setPendingGeneration(restored);
          // Pass restored images directly since state hasn't updated yet
          executeGeneration(restored.styles, restored.config, newCredits, restoredImages || {});
        } catch {
          localStorage.removeItem(PENDING_GEN_KEY);
          setCurrentStep('settings');
        }
      } else {
        setCurrentStep('settings');
      }
    }
  }, [user]);

  const handleGoHome = () => {
    setCurrentStep('upload');
    window.scrollTo(0, 0);
  };

  const handleReferenceUpdate = (newImages: MultiReferenceSet) => {
    setReferenceImages(newImages);
  };

  const handleUploadContinue = () => {
    setCurrentStep('settings');
    window.scrollTo(0, 0);
  };

  const handleConfigChange = (newConfig: GenerationConfig) => {
    setGenerationConfig(newConfig);
    // Persist About You fields so they survive any navigation
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
      // Save pending generation AND reference images before Stripe redirect
      localStorage.setItem(PENDING_GEN_KEY, JSON.stringify(pending));
      await saveRefImagesToStorage(referenceImages);
      setCurrentStep('payment');
      window.scrollTo(0, 0);
      return;
    }
    // If credits haven't loaded yet, wait briefly and retry
    if (!creditsLoaded) {
      console.warn('[VeraLooks] Credits not yet loaded — waiting before routing');
      return;
    }
    await executeGeneration(styles, config, credits, referenceImages);
  };

  // refOverride lets us pass freshly-restored images before state updates
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

          // Only deduct credit when image actually succeeds
          currentCredits = Math.max(0, currentCredits - 1);
          setCredits(currentCredits);

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
    setCredits(prev => Math.max(0, prev - amount));
  };

  const handleAddCredits = () => {
    setCurrentStep('payment');
  };

  const handleGenerateMore = () => {
    setCurrentStep('settings');
    window.scrollTo(0, 0);
  };

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
                <div
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                  style={{ background: 'rgba(76,29,149,0.15)', border: '1px solid rgba(76,29,149,0.3)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#9F67FF' }} />
                  <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {credits} Credits
                  </span>
                </div>
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
                    <p className="text-sm font-semibold text-red-300 mb-1">Generation Error</p>
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
