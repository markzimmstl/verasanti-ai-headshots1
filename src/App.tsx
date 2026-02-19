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

const VERALOOKS_LOGO = 'data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCADnA+IDASIAAhEBAxEB/8QAHQABAAMBAQEBAQEAAAAAAAAAAAcICQYFBAMCAf/EAGMQAAEDAgMDBQoFDAwMBgEFAAEAAgMEBQYHEQgSIRgxQVFhEyJVVnGBlKXT1BQyUpGhFSNCYnKChJKisbLBCRYzNjc4c5Ojs7TDJDQ1RVNjdHWVwtHSFyVDVIPhRCdl4/Dx/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAMFAgQGAQf/xAA+EQACAQIDBAUICQQDAQEAAAAAAQIDBAURMRIhQVFhcYGRsQYTFCIyNHKhIzM1QlKyweHwFWKC0SSDkvFD/9oADAMBAAIRAxEAPwCmSIv0p4Zqmojp6eKSaaV4ZHGxpc57idAABxJJ6EB+a6vAmXGOsdS7mE8L3K6sDt100cW7C09TpXaMafKVbLZx2TKCjpabE2adOKuteBJBZCfrUHSDOR8d32g70dO9zC2tDSUtBRxUdDTQ0tNC0MihhjDGMaOYNaOAHYEBntaNjrN6uha+pfhy2OPOyqr3OcP5pjx9K9DkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+H8GemVPu6v8AogKAcirNPw/gz0yp93TkVZp+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bfzBepFHHEwMiY1jRzBo0C/pFioxTzSM5VJSWTYREWRgEREAREQBERAEREAREQBERAEREAREQBERAEREAX+EA84B8q/1EAREQBERAEREAREQBYzrZaaRsUL5XnRrGlx8gWNKAIiIDsckcRx4SzdwtiGd4jp6O5wuqHfJhLt2Q/iOctZxxGoWM60r2OMzocw8qKSjrKkPv1iYyirmOPfSMA0im7Q5o0J+U13YgJtREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREBxWe+JI8JZO4qv8kgY+ntsrYCTprM8dziHne5qycVxf2Q3M6Gogpcr7TUB/cHtrbuWHgH6fWoT2gEvI7WKnSAIiIAuwyhzCv2WWN6XFFhkBkj+t1FO8nudVCSN6N/YdAQeggHoXHogNYMnc0cKZpYaZeMOVre7MaBWUMjgJ6R5+xe3q59HDgejpA7hY+4TxJfsJ3uG9Ybu1Xa7hD8SenfunTpaehzT0tOoPSFajLbbWuVLBFR5gYZbcN0AaWr7Y4RyO7XRO70nyOaOxAXaRQRadrTJWtha+pvlxtrjzsqbZM5w8vcg8fSvR5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUM8qPInx59U1vsU5UeRPjz6prfYoCZkUMnakyKA1GOCewWmt9ivAxFtg5Q22FzrbLer1Lp3raahMYJ7TKWaDzFAWFUEbT20JZcsbXPZLHPBccYTM3YqdpDmUWo4STdvSGc54a6Dia45sbXuOsUU81uwnSRYToJAWmaKTutY4dkhADPvW6j5SrhUTTVE8lRUSyTTSOL5JHuLnPcTqSSeJJ60B+t0r6263KpuVxqZaqsqpXTTzSu3nyPcdXOJ6SSV8yIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiA//9k=';
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
