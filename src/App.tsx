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

const VERALOOKS_LOGO = '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';

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

  const [referenceImages, setReferenceImages] = useState<MultiReferenceSet>(() => {
    const saved = localStorage.getItem('veralooks_refs');
    return saved ? JSON.parse(saved) : {};
  });

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
  useEffect(() => { localStorage.setItem('veralooks_refs', JSON.stringify(referenceImages)); }, [referenceImages]);

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
          
          const selectedClothing = config.clothing; 
          const selectedBackgroundID = config.backgroundType;

          let selectedScenePrompt = "";
          Object.values(BRAND_DEFINITIONS).forEach(brand => {
            const foundScene = brand.sceneOptions.find((s: any) => s.id === selectedBackgroundID || s.name === selectedBackgroundID);
            if (foundScene) {
              selectedScenePrompt = foundScene.prompt;
            }
          });

          if (!selectedScenePrompt) {
            selectedScenePrompt = "in a professional corporate setting";
          }
          
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
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* VERALOOKS LOGO - CLICKABLE */}
          <button 
            onClick={handleGoHome}
            className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="VeraLooks Home"
          >
            <img 
              src={`data:image/png;base64,${VERALOOKS_LOGO}`}
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
