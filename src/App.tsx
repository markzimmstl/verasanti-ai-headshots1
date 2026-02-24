import React, { useState, useEffect } from 'react';
import { UploadStep } from './components/UploadStep';
import { PaymentStep } from './components/PaymentStep';
import { SettingsStep } from './components/SettingsStep';
import ResultsStep from './components/ResultsStep';
import { 
  GenerationConfig, 
  GeneratedImage, 
  StyleOption, 
  MultiReferenceSet 
} from './types';
import { generateBrandPhotoWithRefsSafe } from './services/geminiService';
import { Loader2, AlertCircle } from 'lucide-react';

// @ts-ignore
import { BRAND_DEFINITIONS } from './data/brandDefinitions';

const DEFAULT_CONFIG: GenerationConfig = {
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

const LOADING_PHRASES = [
  "Mapping facial geometry and landmarks...",
  "Constructing 3D lighting environment...",
  "Calculating realistic skin texture response...",
  "Synthesizing wardrobe materials and folds...",
  "Applying professional color grading...",
  "Finalizing high-fidelity render..."
];

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

  // FIX: Reference images are kept in memory only — not persisted to localStorage.
  // Base64 images are too large (~10MB for 4 photos) and exceed the 5MB localStorage limit.
  // Users simply re-upload if they refresh the page, which is the expected behavior.
  const [referenceImages, setReferenceImages] = useState<MultiReferenceSet>({});

  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('veralooks_step', currentStep); }, [currentStep]);
  useEffect(() => { localStorage.setItem('veralooks_credits', credits.toString()); }, [credits]);
  useEffect(() => { 
    if (pendingGeneration) localStorage.setItem('veralooks_pending', JSON.stringify(pendingGeneration));
    else localStorage.removeItem('veralooks_pending');
  }, [pendingGeneration]);
  // FIX: Removed the useEffect that wrote referenceImages to localStorage — caused QuotaExceededError.

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingPhaseIndex(0);
      interval = setInterval(() => {
        setLoadingPhaseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

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
    const totalImagesRequested = styles.reduce((sum, style) => sum + (style.imageCount || 1), 0);

    setIsGenerating(true);
    setError(null);
    const newImages: GeneratedImage[] = [];
    
    setCredits(prev => Math.max(0, prev - totalImagesRequested));

    let globalImageIndex = 0;

    try {
      for (const style of styles) {
        const countForThisLook = style.imageCount || 1;

        const finalConfigForThisLook = {
            ...config,
            ...(style.overrides || {}) 
        };

       for (let i = 0; i < countForThisLook; i++) {
          setLoadingMessage(`Generating ${style.name} (Image ${i + 1} of ${countForThisLook})...`);
          
          const selectedClothing = finalConfigForThisLook.clothing;
          const selectedScenePrompt = finalConfigForThisLook.backgroundType || "in a professional corporate setting";

          const fullPrompt = `${selectedClothing}, ${selectedScenePrompt}`;

          const imageUrl = await generateBrandPhotoWithRefsSafe(
            referenceImages,
            fullPrompt,
            finalConfigForThisLook,
            undefined,
            globalImageIndex
          );

          if (!imageUrl) throw new Error("Failed to generate image");

          newImages.push({
            id: Date.now().toString() + Math.random().toString(),
            originalUrl: imageUrl,
            imageUrl: imageUrl, 
            styleName: `${style.name} ${i + 1}`,
            styleId: style.id,
            createdAt: Date.now(),
            aspectRatio: finalConfigForThisLook.aspectRatio || '1:1'
          });
          
          globalImageIndex++;
          await new Promise(r => setTimeout(r, 500));
        }
      }

      setGeneratedImages(prev => [...newImages, ...prev]);
      setPendingGeneration(null);
      setCurrentStep('results');
      window.scrollTo(0, 0);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <button 
            onClick={handleGoHome}
            className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="VeraLooks Home"
          >
           <img 
              src="/logo.png"
              alt="VeraLooks"
              className="h-9 w-auto"
            />
          </button>
          
          <div className="hidden md:flex items-center gap-2 text-xs font-medium bg-slate-900 p-1 rounded-lg border border-slate-800">
            <span className={`px-3 py-1.5 rounded-md transition-colors ${currentStep === 'upload' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}>1. Reference</span>
            <span className={`px-3 py-1.5 rounded-md transition-colors ${currentStep === 'settings' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}>2. Style</span>
            <span className={`px-3 py-1.5 rounded-md transition-colors ${currentStep === 'payment' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}>3. Payment</span>
            <span className={`px-3 py-1.5 rounded-md transition-colors ${currentStep === 'results' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}>4. Results</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-medium px-3 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
              {credits} Credits
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative">
        {error && (
          <div className="max-w-4xl mx-auto mt-8 px-4 w-full">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p>{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-xs hover:text-white underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh] animate-fade-in">
            <div className="text-center space-y-12">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-slate-400 tracking-tight">Creating your Photos</h2>
                <div className="min-h-[80px] flex items-center justify-center px-4">
                  <p 
                    key={loadingPhaseIndex} 
                    className="text-indigo-100 text-3xl md:text-5xl font-extrabold text-center animate-fade-in-up leading-tight max-w-4xl mx-auto"
                  >
                    {LOADING_PHRASES[loadingPhaseIndex]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 w-full">
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
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
