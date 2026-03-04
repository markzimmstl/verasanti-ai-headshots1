import React, { useState, useEffect } from 'react';
import { UploadStep } from './components/UploadStep';
import { PaymentStep } from './components/PaymentStep';
import { SettingsStep } from './components/SettingsStep';
import { ProcessingStep } from './components/ProcessingStep';
import ResultsStep from './components/ResultsStep';
import { 
  GenerationConfig, 
  GeneratedImage, 
  StyleOption, 
  MultiReferenceSet 
} from './types';
import { generateBrandPhotoWithRefsSafe } from './services/geminiService';
import { AlertCircle } from 'lucide-react';

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

function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'settings' | 'payment' | 'results'>(() => {
    return (localStorage.getItem('veralooks_step') as any) || 'upload';
  });

  const [credits, setCredits] = useState(() => {
    return parseInt(localStorage.getItem('veralooks_credits') || '0', 10);
  });
  
  const [pendingGeneration, setPendingGeneration] = useState<{ styles: StyleOption[], config: GenerationConfig } | null>(() => {
    const saved = localStorage.getItem('veralooks_pending');
    return saved ? JSON.parse(saved) : null;
  });

  // FIX: Reference images kept in memory only — Base64 images are too large for localStorage.
  const [referenceImages, setReferenceImages] = useState<MultiReferenceSet>({});
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [settingsKey, setSettingsKey] = useState(0);

  useEffect(() => { localStorage.setItem('veralooks_step', currentStep); }, [currentStep]);
  useEffect(() => { localStorage.setItem('veralooks_credits', credits.toString()); }, [credits]);
  useEffect(() => { 
    if (pendingGeneration) localStorage.setItem('veralooks_pending', JSON.stringify(pendingGeneration));
    else localStorage.removeItem('veralooks_pending');
  }, [pendingGeneration]);

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
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
  };

  const handleGenerateRequest = async (styles: StyleOption[], config: GenerationConfig) => {
    const totalImagesRequested = styles.reduce((sum, style) => sum + (style.imageCount || 1), 0);
    if (credits < totalImagesRequested) {
      setPendingGeneration({ styles, config });
      setCurrentStep('payment');
      window.scrollTo(0, 0);
      return;
    }
    await executeGeneration(styles, config);
  };

  const executeGeneration = async (styles: StyleOption[], config: GenerationConfig) => {
    setIsGenerating(true);
    setError(null);
    const newImages: GeneratedImage[] = [];
    let globalImageIndex = 0;

    try {
      for (const style of styles) {
        const countForThisLook = style.imageCount || 1;
        const finalConfigForThisLook: GenerationConfig = {
          ...config,
          ...(style.overrides || {}),
        };

        for (let i = 0; i < countForThisLook; i++) {
          setLoadingMessage(`Generating ${style.name} (Image ${i + 1} of ${countForThisLook})...`);

          const isExpertMode = !!finalConfigForThisLook.expertPrompt?.trim();
          const fullPrompt = isExpertMode
            ? finalConfigForThisLook.expertPrompt!.trim()
            : `${finalConfigForThisLook.clothing}, ${finalConfigForThisLook.backgroundType || "in a professional corporate setting"}`;

          let imageUrl: string | null = null;
          try {
            imageUrl = await generateBrandPhotoWithRefsSafe(
              referenceImages,
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
          setCredits(prev => Math.max(0, prev - 1));

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
    setCurrentStep('results');
    window.scrollTo(0, 0);
    if (pendingGeneration) {
      executeGeneration(pendingGeneration.styles, pendingGeneration.config);
    }
  };

  const handlePaymentBack = () => {
    setCurrentStep('settings');
  };

  const handleReset = () => {
    // Preserve About You fields — users shouldn't re-enter gender/age/hair every time
    setGenerationConfig(prev => ({
      ...DEFAULT_CONFIG,
      genderPresentation: prev.genderPresentation,
      ageRange: prev.ageRange,
      hairColor: prev.hairColor,
      includeRing: prev.includeRing,
    }));
    // Force SettingsStep to fully remount with clean local state
    setSettingsKey(k => k + 1);
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

  // Map app state to step nav index
  const stepNavIndex = isGenerating ? 2
    : currentStep === 'upload'   ? 0
    : currentStep === 'settings' ? 1
    : currentStep === 'results'  ? 3
    : 1; // payment sits on step 1 visually

  return (
    <div className="min-h-screen text-white font-sans flex flex-col" style={{ background: '#080A0F' }}>

      {/* ── HEADER ── */}
      <header
        className="border-b sticky top-0 z-40 shrink-0 backdrop-blur-xl"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,10,15,0.92)' }}
      >
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={handleGoHome}
            className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="VeraLooks Home"
          >
            <img src="/VeraLooks_logo_white.png" alt="VeraLooks" style={{ height: 28, width: 'auto' }} />
          </button>

          {/* Step nav */}
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

          {/* Credits pill */}
          <div
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
            style={{ background: 'rgba(76,29,149,0.15)', border: '1px solid rgba(76,29,149,0.3)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#9F67FF' }} />
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {credits} Credits
            </span>
          </div>
        </div>
      </header>

      {/* ── ERROR MODAL ── */}
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

      {/* ── MAIN ── */}
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
                key={settingsKey}
                config={generationConfig}
                credits={credits}
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
              />
            )}
            {currentStep === 'results' && (
              <ResultsStep
                images={generatedImages}
                onRestart={handleReset}
                refs={referenceImages}
                baseConfig={generationConfig}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
