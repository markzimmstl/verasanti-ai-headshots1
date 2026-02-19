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

const VERALOOKS_LOGO = 'data:image/jpeg;base64,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PFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbouW2+sWZI3iCVbHMGIJkQbXb3pbkp+Sy2UrfWylAWpAOqd1SiB4OhoqQ8iMH5iY6tP3fxLaLNZbY5/s7LTTpfd7dVL0SPqPVz66bJoiPQgvedS2iPQgvedTmiIj0ILXnUtor0ILXnU5oiI9CC151LaK9CC151OaIiPQgtefS2iPQgtedTmiIj0ILznUtor0ILXnUtoiI9CC151LaK9CC151OaIiPQgvedS2ivQgtefTmiIj0ILXnUtor0ILXnU5oiI9CC151LaK9CC151OaIiPQgvedS2ivQgtefTmiIj0ILXnUtor0ILXnU5oiI9CC151LaK9CC151OaIiK07K+em1+dH75qrW2kHUM5E4xW4rdBtjiQdOlWgH6yKinZK+em1+dH75qrW2kHUM5E4xW4rdBtjiQdOlWgH6yKinZK+em1+dH75qr4cIS8NbCr1ov4bO7vdXr3WM0/KXjP07J9ujusZp+UvGfp2T7dEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbomPmFijdH9mLL+6VOvacCPFUfBHOVf8Oy/lkF9sVEWstFZNd1jNPyl4z9OyfbouW2+sWZI3iCVbHMGIJkQbXb3pbkp+Sy2UrfWylAWpAOqd1SiB4OhoqQ8iMH5iY6tP3fxLaLNZbY5/s7LTTpfd7dVL0SPqPVz66bJoiPQgvedS2iPQgvedTmiIj0ILXnUtor0ILXnU5oiI9CC151LaK9CC151OaIiPQgvedS2ivQgtefTmiIj0ILXnUtor0ILXnU5oiI9CC151LaK9CC151OaIiPQgvedS2ivQgtefTmiIj0ILXnUtor0ILXnU5oiI9CC151LaK9CC151OaIiK2xL/Ziwj/jf41+nNSZ2Jf7MWEf8b/Gv05qImk3ZihaIiLEREQEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAf/9k=';
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
                src={VERALOOKS_LOGO}
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
