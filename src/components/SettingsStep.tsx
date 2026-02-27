import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  Camera,
  LayoutTemplate,
  Wand2,
  Sparkles,
  Trash2,
  Edit3,
  Shuffle,
  Droplet,
  Glasses,
  ImageIcon,
  Aperture,
  Focus,
  Sun,
  Maximize,
  Palette,
  Pipette,
  Check,
  Plus,
  Zap,
  Ban,
  Upload,
  User,
  AlertCircle,
  ChevronDown,
  ListChecks,
  Loader2,
  Sparkle,
} from 'lucide-react';

import { Button } from './Button.tsx';
import { BRAND_DEFINITIONS } from '../data/brandDefinitions.ts';
import { GenerationConfig, StyleOption, LookConfig, AspectRatio } from '../types.ts';

declare global {
  interface Window { EyeDropper: any; }
}

type VariationLevel = 'low' | 'medium' | 'high';

interface SettingsStepProps {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  onNext: (styles: StyleOption[], config: GenerationConfig) => void;
  onBack: () => void;
  credits: number;
}

type CreationMode = 'guided' | 'expert';

const MAX_LOOKS = 5;
const ORANGE = '#f47621';

const cloneConfig = (cfg: GenerationConfig): GenerationConfig =>
  JSON.parse(JSON.stringify(cfg));

const DEFAULT_VARIATION_LEVEL: VariationLevel = 'high';
const DEFAULT_BODY_OFFSET = 0;

const PRESET_COLORS = [
  '#FFFFFF', '#0A0A0A', '#1F2937', '#DC2626', '#EA580C', '#D97706',
  '#65A30D', '#16A34A', '#059669', '#0D9488', '#0891B2', '#0284C7',
  '#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#C026D3', '#DB2777',
  '#E11D48', '#57534E'
];

const HAIR_COLORS = [
  { label: 'Bald',         color: '#C8A882', textColor: '#000' },
  { label: 'Black',        color: '#1a1a1a', textColor: '#fff' },
  { label: 'Dark Brown',   color: '#3b1f0a', textColor: '#fff' },
  { label: 'Medium Brown', color: '#7b4a1e', textColor: '#fff' },
  { label: 'Light Brown',  color: '#a0673a', textColor: '#fff' },
  { label: 'Blonde',       color: '#d4a843', textColor: '#000' },
  { label: 'Red / Auburn', color: '#8b2500', textColor: '#fff' },
  { label: 'Gray / Silver',color: '#9ca3af', textColor: '#000' },
  { label: 'White',        color: '#e5e7eb', textColor: '#000' },
  { label: 'Other',        color: '#6366f1', textColor: '#fff' },
];

const AGE_RANGES = ['18–29', '30–44', '45–59', '60+'];

export const SettingsStep: React.FC<SettingsStepProps> = ({
  config,
  onChange,
  onNext,
  onBack,
  credits,
}) => {
  const [creationMode, setCreationMode] = useState<CreationMode>('guided');
  const [expertPromptInput, setExpertPromptInput] = useState(config.expertPrompt || '');
  const [looks, setLooks] = useState<LookConfig[]>([]);
  const [activeLookId, setActiveLookId] = useState<string | null>(null);
  const [clothingStyleGroup, setClothingStyleGroup] = useState<string | null>(null);
  const [clothingOption, setClothingOption] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [sceneName, setSceneName] = useState<string | null>(null);
  const [scenePrompt, setScenePrompt] = useState<string | null>(null);
  const [cameraExpanded, setCameraExpanded] = useState(false);
  const [isCustomClothing, setIsCustomClothing] = useState(false);
  const [customClothingText, setCustomClothingText] = useState('');
  const [isCustomBackground, setIsCustomBackground] = useState(false);
  const [customBgMode, setCustomBgMode] = useState<'prompt' | 'color' | 'upload'>('prompt');
  const [customBgText, setCustomBgText] = useState('');
  const [customBgColor, setCustomBgColor] = useState('');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState<number>(2);
  const [variationLevel, setVariationLevel] = useState<VariationLevel>(DEFAULT_VARIATION_LEVEL);
  const [bodySizeOffset, setBodySizeOffset] = useState<number>(DEFAULT_BODY_OFFSET);
  const [activeColorPicker, setActiveColorPicker] = useState<'primary' | 'secondary' | 'customBg' | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // About You validation warning
  const [showAboutYouWarning, setShowAboutYouWarning] = useState(false);

  // Shot list generator state
  const [shotListExpanded, setShotListExpanded] = useState(false);
  const [shotListDescription, setShotListDescription] = useState('');
  const [shotListCount, setShotListCount] = useState<3|5|10>(5);
  const [shotListLoading, setShotListLoading] = useState(false);
  const [shotList, setShotList] = useState<any[]>([]);
  const [shotListError, setShotListError] = useState<string|null>(null);
  const [shotListExpandedCards, setShotListExpandedCards] = useState<Set<number>>(new Set());
  const [showGenerateAllConfirm, setShowGenerateAllConfirm] = useState(false);

  // Sync expert prompt input when parent config changes (e.g. after a reset clears it)
  useEffect(() => {
    setExpertPromptInput(config.expertPrompt || '');
  }, [config.expertPrompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setActiveColorPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateConfig = (patch: Partial<GenerationConfig>) => {
    onChange({ ...config, ...patch });
  };

  // ── About You helpers ──────────────────────────────────────────
  const ringLabel = () => {
    if (config.genderPresentation === 'woman') return 'Include diamond engagement / wedding ring';
    if (config.genderPresentation === 'man')   return 'Include gold wedding band';
    return 'Include wedding / commitment ring';
  };

  const ringPrompt = () => {
    if (config.genderPresentation === 'woman') return 'wearing a diamond solitaire engagement ring and thin gold wedding band on left ring finger';
    if (config.genderPresentation === 'man')   return 'wearing a classic polished gold wedding band on left ring finger';
    return 'wearing a simple elegant wedding band on left ring finger';
  };

  // ── Config helpers ─────────────────────────────────────────────
  const handleExpertPromptChange = (value: string) => {
    setExpertPromptInput(value);
    updateConfig({ expertPrompt: value });
  };

  const handleClothingStyleGroupSelect = (groupKey: string) => {
    setClothingStyleGroup(groupKey);
    setClothingOption(null);
    setSceneId(null);
    setSceneName(null);
    setScenePrompt(null);
    setIsCustomClothing(false);
    setIsCustomBackground(false);
  };

  const handleClothingOptionSelect = (groupKey: string, value: string) => {
    setClothingStyleGroup(groupKey);
    setClothingOption(value);
    setIsCustomClothing(false);
    updateConfig({ clothing: value });
  };

  const handleSceneSelect = (groupKey: string, id: string, name: string, prompt: string) => {
    setClothingStyleGroup(groupKey);
    setSceneId(id);
    setSceneName(name);
    setScenePrompt(prompt);
    setIsCustomBackground(false);
    updateConfig({ backgroundType: prompt, customBackground: undefined });
  };

  const handleCustomClothingToggle = () => {
    setIsCustomClothing(true);
    setClothingOption('Custom Outfit');
    updateConfig({ clothing: customClothingText });
  };

  const handleCustomClothingTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomClothingText(e.target.value);
    updateConfig({ clothing: e.target.value });
  };

  const handleCustomBackgroundToggle = () => {
    setIsCustomBackground(true);
    setSceneId('custom');
    setSceneName('Custom Background');
    updateCustomBackground(customBgMode);
  };

  const updateCustomBackground = (mode: 'prompt' | 'color' | 'upload') => {
    if (mode === 'prompt') {
      setScenePrompt(customBgText);
      updateConfig({ backgroundType: customBgText, customBackground: undefined });
    } else if (mode === 'color') {
      const prompt = `Solid background color: ${customBgColor || '#FFFFFF'}`;
      setScenePrompt(prompt);
      updateConfig({ backgroundType: prompt, customBackground: undefined });
    } else if (mode === 'upload' && customBgImage) {
      setScenePrompt('Using uploaded background image reference.');
      updateConfig({ backgroundType: 'Custom Upload', customBackground: customBgImage });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomBgImage(base64);
        setScenePrompt('Using uploaded background image reference.');
        updateConfig({ backgroundType: 'Custom Upload', customBackground: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetouchChange = (retouchLevel: GenerationConfig['retouchLevel']) => updateConfig({ retouchLevel });
  const handleBrandColorChange = (color: string) => updateConfig({ brandColor: color });
  const handleSecondaryBrandColorChange = (color: string) => updateConfig({ secondaryBrandColor: color });
  const handleKeepGlassesChange = (keep: boolean) => updateConfig({ keepGlasses: keep });

  const isEyeDropperSupported = !!window.EyeDropper;

  const pickColorWithEyeDropper = async (field: 'brandColor' | 'secondaryBrandColor' | 'customBg') => {
    if (!isEyeDropperSupported) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const hexColor = result.sRGBHex;
      if (field === 'brandColor') handleBrandColorChange(hexColor);
      else if (field === 'secondaryBrandColor') handleSecondaryBrandColorChange(hexColor);
      else {
        setCustomBgColor(hexColor);
        const prompt = `Solid background color: ${hexColor}`;
        setScenePrompt(prompt);
        updateConfig({ backgroundType: prompt, customBackground: undefined });
      }
    } catch { console.log('EyeDropper cancelled'); }
  };

  const handleAspectRatioChange = (ratio: AspectRatio) => updateConfig({ aspectRatio: ratio });
  const handleFramingChange = (framing: string) => updateConfig({ framing });
  const handleMoodChange = (mood: string) => updateConfig({ mood });
  const handleCameraAngleChange = (angle: string) => updateConfig({ cameraAngle: angle });

  const handleSurpriseMe = () => {
    if (!clothingStyleGroup) { alert('Choose a Clothing Style first, then click Surprise Me.'); return; }
    const brand = BRAND_DEFINITIONS[clothingStyleGroup];
    if (!brand) return;
    const allClothingChoices = brand.clothingOptions.flatMap((group: any) =>
      group.items.map((item: any) => ({ category: group.category, value: item }))
    );
    if (allClothingChoices.length === 0) return;
    const clothingChoice = allClothingChoices[Math.floor(Math.random() * allClothingChoices.length)];
    const allScenes = brand.sceneOptions;
    if (allScenes.length === 0) return;
    const sceneChoice = allScenes[Math.floor(Math.random() * allScenes.length)];
    setClothingOption(clothingChoice.value);
    setSceneId(sceneChoice.id);
    setSceneName(sceneChoice.name);
    setScenePrompt(sceneChoice.prompt);
    setIsCustomClothing(false);
    setIsCustomBackground(false);
    updateConfig({
      clothing: clothingChoice.value,
      backgroundType: sceneChoice.prompt,
      aspectRatio: config.aspectRatio || '1:1',
      framing: config.framing || 'Waist Up',
      cameraAngle: config.cameraAngle || 'Eye Level',
      mood: config.mood || 'Polished Professional',
      lighting: config.lighting || 'Pro Studio',
      retouchLevel: config.retouchLevel || 'None',
      customBackground: undefined,
    });
  };

  const resetBuilder = () => {
    setActiveLookId(null);
    setClothingStyleGroup(null);
    setClothingOption(null);
    setSceneId(null);
    setSceneName(null);
    setScenePrompt(null);
    setImageCount(2);
    setVariationLevel(DEFAULT_VARIATION_LEVEL);
    setBodySizeOffset(DEFAULT_BODY_OFFSET);
    setIsCustomClothing(false);
    setIsCustomBackground(false);
    setCustomBgImage(null);
  };

  const canBuildLook = clothingStyleGroup && clothingOption && sceneId && scenePrompt && config.framing && config.aspectRatio && config.mood;

  const handleAddOrUpdateLook = () => {
    if (!canBuildLook) { alert('Please choose a Clothing Style, clothing option, scene, and camera settings for this Look.'); return; }
    if (!clothingStyleGroup || !clothingOption || !sceneId || !sceneName || !scenePrompt) return;
    const newLook: LookConfig = {
      id: activeLookId || `${Date.now()}`,
      label: activeLookId ? looks.find((l) => l.id === activeLookId)?.label || 'Look' : `Look #${looks.length + 1}`,
      clothingStyleGroup, clothingOption, sceneId, sceneName, scenePrompt,
      imageCount, variationLevel, bodySizeOffset,
      config: cloneConfig({ ...config, retouchLevel: config.retouchLevel || 'None' }),
      isSurprise: false,
    };
    setLooks((prev) => {
      if (activeLookId) return prev.map((look) => look.id === activeLookId ? newLook : look);
      if (prev.length >= MAX_LOOKS) { alert(`You can create up to ${MAX_LOOKS} Looks.`); return prev; }
      return [...prev, newLook];
    });
    if (!activeLookId) resetBuilder();
  };

  const handleEditLook = (look: LookConfig) => {
    setActiveLookId(look.id);
    setClothingStyleGroup(look.clothingStyleGroup);
    setClothingOption(look.clothingOption);
    setSceneId(look.sceneId);
    setSceneName(look.sceneName);
    setScenePrompt(look.scenePrompt);
    setImageCount(look.imageCount);
    setVariationLevel(look.variationLevel ?? DEFAULT_VARIATION_LEVEL);
    setBodySizeOffset(typeof look.bodySizeOffset === 'number' ? look.bodySizeOffset : DEFAULT_BODY_OFFSET);
    onChange(cloneConfig(look.config));
    setIsCustomClothing(false);
    setIsCustomBackground(false);
  };

  const handleDeleteLook = (id: string) => {
    setLooks((prev) => prev.filter((l) => l.id !== id));
    if (activeLookId === id) resetBuilder();
  };

  const totalImages = looks.reduce((sum, look) => sum + look.imageCount, 0);

  const aboutYouComplete = !!config.genderPresentation && !!config.ageRange;

  const handleContinue = () => {
    // Require gender + age
    if (!config.genderPresentation || !config.ageRange) {
      setShowAboutYouWarning(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let stylesToUse: StyleOption[] = [];
    {
      if (looks.length === 0) { alert('Please create at least one Look.'); return; }
      stylesToUse = looks.map((look) => ({
        id: look.id,
        name: look.label,
        description: `${look.clothingOption} – ${look.sceneName}`,
        promptModifier: look.scenePrompt,
        thumbnailColor: '#111827',
        imageCount: look.imageCount,
        clothingDescription: look.clothingOption,
        variationLevel: look.variationLevel,
        bodySizeOffset: look.bodySizeOffset,
        overrides: { ...look.config, bodySizeOffset: look.bodySizeOffset },
      }));
    }

    const baseConfig: GenerationConfig = {
      ...config,
      retouchLevel: config.retouchLevel || 'None',
      variationsCount: 1,
    };

    onNext(stylesToUse, baseConfig);
  };

  // ── Shot List Generator ────────────────────────────────────────────────────
  const buildShotListPrompt = (description: string, count: number) => `
You are a personal brand photography strategist with 20 years of experience.
A customer described their work as: "${description}"
Generate exactly ${count} specific, personalized brand photography shots for them.
Respond ONLY with a valid JSON array — no markdown, no backticks, no explanation.
Format:
[{"number":1,"name":"3-5 word name","scene":"One sentence visual scene","why":"One sentence why it builds their brand","mood":"Confident|Approachable|Expert|Behind-the-Scenes|Lifestyle|Action|Story","prompt":"2-3 sentence generation prompt, specific and visual"}]
Make every shot feel tailored to their specific line of work, clients, and credibility signals. Avoid generic suggestions.
`.trim();

  const generateShotList = async () => {
    if (!shotListDescription.trim() || shotListLoading) return;
    setShotListLoading(true);
    setShotListError(null);
    setShotList([]);
    setShotListExpandedCards(new Set());
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: buildShotListPrompt(shotListDescription, shotListCount) }],
        }),
      });
      const data = await response.json();
      const raw = data.content?.find((b: any) => b.type === "text")?.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) throw new Error("Bad format");
      setShotList(parsed);
    } catch {
      setShotListError("Something went wrong. Please try again.");
    } finally {
      setShotListLoading(false);
    }
  };

  const toggleShotCard = (num: number) => {
    setShotListExpandedCards(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const handleGenerateAllShots = () => {
    if (shotList.length === 0 || !config.genderPresentation || !config.ageRange) {
      if (!config.genderPresentation || !config.ageRange) {
        setShowAboutYouWarning(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    setShowGenerateAllConfirm(true);
  };

  const confirmGenerateAllShots = () => {
    setShowGenerateAllConfirm(false);
    const stylesToUse: StyleOption[] = shotList.map((shot, i) => ({
      id: `shot-${shot.number}`,
      name: shot.name,
      description: shot.scene,
      promptModifier: shot.prompt,
      thumbnailColor: '#111827',
      imageCount: 1,
      overrides: { expertPrompt: shot.prompt },
    }));
    const baseConfig: GenerationConfig = {
      ...config,
      retouchLevel: config.retouchLevel || 'None',
      variationsCount: 1,
    };
    onNext(stylesToUse, baseConfig);
  };

  const canContinue = aboutYouComplete && looks.length > 0;

  // Color picker renderer
  const renderColorPicker = (
    type: 'primary' | 'secondary' | 'customBg',
    currentValue: string,
    onChange: (val: string) => void,
    placeholder: string
  ) => {
    const isActive = activeColorPicker === type;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveColorPicker(isActive ? null : type)}
          className={`w-full flex items-center gap-2 bg-slate-950 border rounded-lg px-3 py-2 text-xs transition-all ${isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-700 hover:border-slate-500'}`}
        >
          <div
            className="w-4 h-4 rounded-full border border-slate-600 shadow-sm"
            style={{
              backgroundColor: currentValue || 'transparent',
              backgroundImage: currentValue ? 'none' : 'linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b), linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b)',
              backgroundSize: '4px 4px',
              backgroundPosition: '0 0, 2px 2px',
            }}
          />
          <span className={currentValue ? 'text-white' : 'text-slate-500'}>{currentValue || placeholder}</span>
        </button>
        {isActive && (
          <div ref={colorPickerRef} className="absolute bottom-full left-0 mb-2 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 w-64 animate-fade-in">
            <button type="button" onClick={() => { onChange(''); setActiveColorPicker(null); }} className="flex items-center gap-2 w-full text-left px-2 py-1.5 mb-3 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700">
              <Ban className="w-3 h-3 text-red-400" /><span>None / Clear</span>
            </button>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {PRESET_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => { onChange(color); setActiveColorPicker(null); }} className="w-8 h-8 rounded-full border border-slate-700 hover:scale-110 transition-transform relative group" style={{ backgroundColor: color }}>
                  {currentValue === color && <div className="absolute inset-0 flex items-center justify-center"><Check className="w-4 h-4 text-white drop-shadow-md" /></div>}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">#</span>
                <input type="text" value={currentValue.replace('#', '')} onChange={(e) => onChange(`#${e.target.value}`)} placeholder="HEX" className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-5 pr-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="button" onClick={() => { pickColorWithEyeDropper(type as any); setActiveColorPicker(null); }} disabled={!isEyeDropperSupported} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" title="Pick from screen">
                <Pipette className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 animate-fade-in">

      {/* Generate All Confirmation Modal */}
      {showGenerateAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">Generate All {shotList.length} Shots?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              This will use <span className="font-bold text-white">{shotList.length} credit{shotList.length !== 1 ? 's' : ''}</span> and generate one image per shot from your personal brand shot list.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowGenerateAllConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm font-medium transition">Cancel</button>
              <button type="button" onClick={confirmGenerateAllShots} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition">Generate Now</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Design your Photoshoot</h2>
          <p className="text-slate-400 text-sm max-w-lg">Build your Looks by choosing a clothing style, background scene, and fine-tuning details. Generate multiple images per Look.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* ── ABOUT YOU (always visible, required) ─────────────── */}
          <section className={`bg-slate-950/70 border rounded-2xl p-6 sm:p-7 shadow-inner ${showAboutYouWarning && !aboutYouComplete ? 'border-red-500/60' : aboutYouComplete ? 'border-green-500/30' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${aboutYouComplete ? 'bg-green-500' : 'bg-amber-500'}`}>
                  {aboutYouComplete
                    ? <Check className="w-5 h-5 text-white" />
                    : <User className="w-5 h-5 text-white" />}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-semibold text-white">About You</h3>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wide font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">Required</span>
            </div>

            {showAboutYouWarning && !aboutYouComplete && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Please select your gender presentation and age range before continuing.
              </div>
            )}

            <div className="space-y-5">

              {/* Gender Presentation */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: ORANGE }}>Gender Presentation</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'woman',    label: 'Woman' },
                    { value: 'man',      label: 'Man' },
                    { value: 'nonbinary',label: 'Non-binary' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        updateConfig({ genderPresentation: opt.value as any, includeRing: false });
                        setShowAboutYouWarning(false);
                      }}
                      className={`text-xs px-3 py-2.5 rounded-lg border transition-all ${
                        config.genderPresentation === opt.value
                          ? 'bg-indigo-500 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: ORANGE }}>Age Range</p>
                <div className="grid grid-cols-4 gap-2">
                  {AGE_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => { updateConfig({ ageRange: range as any }); setShowAboutYouWarning(false); }}
                      className={`text-xs px-2 py-2.5 rounded-lg border transition-all ${
                        config.ageRange === range
                          ? 'bg-indigo-500 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: ORANGE }}>Hair Color <span className="text-slate-500 normal-case font-normal">(optional — helps consistency)</span></p>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map((hair) => {
                    const isActive = config.hairColor === hair.label;
                    return (
                      <button
                        key={hair.label}
                        type="button"
                        onClick={() => updateConfig({ hairColor: isActive ? undefined : hair.label })}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isActive
                            ? 'border-indigo-400 bg-indigo-500/20 text-white'
                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-slate-600 flex-shrink-0" style={{ backgroundColor: hair.color }} />
                        {hair.label}
                        {isActive && <Check className="w-3 h-3 text-indigo-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wedding Ring — only shown after gender is selected */}
              {config.genderPresentation && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: ORANGE }}>Wedding / Engagement Ring <span className="text-slate-500 normal-case font-normal">(optional)</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateConfig({ includeRing: false })}
                      className={`text-xs px-3 py-2.5 rounded-lg border transition-all ${
                        !config.includeRing
                          ? 'bg-indigo-500 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      None (default)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateConfig({ includeRing: true })}
                      className={`text-xs px-3 py-2.5 rounded-lg border transition-all ${
                        config.includeRing
                          ? 'bg-indigo-500 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      {config.genderPresentation === 'woman'
                        ? '💍 Diamond ring + band'
                        : config.genderPresentation === 'man'
                        ? '💍 Gold wedding band'
                        : '💍 Elegant band'}
                    </button>
                  </div>
                  {config.includeRing && (
                    <p className="text-[11px] text-slate-500 mt-1.5 ml-1">{ringLabel()}</p>
                  )}
                </div>
              )}

            </div>
          </section>

          {creationMode === 'guided' && (
            <>
              {/* ── SECTION 1: CLOTHING STYLE + CLOTHING CHOICE ─────────────────── */}
              <section className="bg-slate-900/60 border-2 border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-inner relative overflow-hidden">
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-sm font-bold text-white">1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-semibold text-white">Clothing Style</h3>
                    </div>
                  </div>
                  {clothingStyleGroup && (
                    <button type="button" onClick={handleSurpriseMe} className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 hover:border-indigo-500/50">
                      <Shuffle className="w-3 h-3" />Surprise Me
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                  {Object.entries(BRAND_DEFINITIONS).map(([key, brand]) => {
                    const isActive = clothingStyleGroup === key;
                    const Icon = (brand as any).icon || Briefcase;
                    return (
                      <button key={key} type="button" onClick={() => handleClothingStyleGroupSelect(key)} className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 group ${isActive ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-900/20' : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'}`}>
                        <div className={`mb-3 p-2.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-300 group-hover:bg-slate-700'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>{(brand as any).label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Clothing Choice — inline below style picker once a group is selected */}
                {clothingStyleGroup && (
                  <div className="mt-6 pt-5 border-t border-slate-700/60 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <LayoutTemplate className="w-4 h-4 text-indigo-400" />
                      <p className="text-sm font-semibold text-white">Clothing Choice</p>
                    </div>
                  {!isCustomClothing ? (
                    <>
                      <div className="space-y-5">
                        {BRAND_DEFINITIONS[clothingStyleGroup]?.clothingOptions.map((group: any) => (
                          <div key={group.category}>
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: ORANGE }}>{group.category}</p>
                            <div className="flex flex-wrap gap-2">
                              {group.items.map((item: any) => {
                                const isActive = clothingOption === item;
                                return (
                                  <button key={item} type="button" onClick={() => handleClothingOptionSelect(clothingStyleGroup, item)} className={`text-xs px-3.5 py-2 rounded-lg border transition-all ${isActive ? 'bg-indigo-500 border-indigo-400 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'}`}>
                                    {item}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-800">
                        <button onClick={handleCustomClothingToggle} className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-medium">
                          <Plus className="w-4 h-4" />Add Your Own Outfit
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-white uppercase">Custom Outfit</span>
                        <button onClick={() => setIsCustomClothing(false)} className="text-xs text-slate-400 hover:text-white underline">Back to presets</button>
                      </div>
                      <textarea value={customClothingText} onChange={handleCustomClothingTextChange} placeholder="Describe the outfit in detail..." className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white min-h-[80px]" />
                    </div>
                  )}
                  </div>
                )}
              </section>

              {/* ── SECTION 2: CHOOSE A BACKGROUND SCENE ── */}
              {clothingStyleGroup && (
                <section className="bg-indigo-950/40 border-2 border-indigo-800/50 rounded-2xl p-6 sm:p-7 shadow-inner animate-fade-in">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-sm font-bold text-white">2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-semibold text-white">Choose a Background Scene</h3>
                    </div>
                  </div>
                  {!isCustomBackground ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {BRAND_DEFINITIONS[clothingStyleGroup]?.sceneOptions.map((scene: any) => {
                          const isActive = sceneId === scene.id;
                          return (
                            <button key={scene.id} type="button" onClick={() => handleSceneSelect(clothingStyleGroup, scene.id, scene.name, scene.prompt)} className={`text-left p-3 rounded-xl border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800'}`}>
                              <p className={`text-xs font-medium mb-1 ${isActive ? 'text-white' : 'text-slate-200'}`}>{scene.name}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{scene.prompt}</p>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-800">
                        <button onClick={handleCustomBackgroundToggle} className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-medium">
                          <Plus className="w-4 h-4" />Add Your Own Background
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-white uppercase">Custom Background</span>
                        <button onClick={() => setIsCustomBackground(false)} className="text-xs text-slate-400 hover:text-white underline">Back to presets</button>
                      </div>
                      <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-lg w-fit">
                        {(['prompt','color','upload'] as const).map((mode) => (
                          <button key={mode} onClick={() => { setCustomBgMode(mode); updateCustomBackground(mode); }} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${customBgMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            {mode === 'prompt' ? 'Describe' : mode === 'color' ? 'Color' : 'Upload'}
                          </button>
                        ))}
                      </div>
                      {customBgMode === 'prompt' && (
                        <textarea value={customBgText} onChange={(e) => { setCustomBgText(e.target.value); setScenePrompt(e.target.value); updateConfig({ backgroundType: e.target.value }); }} placeholder="e.g. A futuristic mars colony interior..." className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white min-h-[80px]" />
                      )}
                      {customBgMode === 'color' && (
                        <div className="w-1/2">
                          {renderColorPicker('customBg', customBgColor, (color) => {
                            setCustomBgColor(color);
                            const prompt = `Solid background color: ${color}`;
                            setScenePrompt(prompt);
                            updateConfig({ backgroundType: prompt, customBackground: undefined });
                          }, 'Select Color')}
                        </div>
                      )}
                      {customBgMode === 'upload' && (
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer relative">
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          {customBgImage ? (
                            <div className="flex items-center justify-center gap-3">
                              <img src={customBgImage} alt="Preview" className="h-12 w-12 object-cover rounded-md" />
                              <span className="text-xs text-green-400">Image Loaded</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <Upload className="w-6 h-6" />
                              <span className="text-xs">Click to upload image</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* ── SECTION 3: FINE-TUNING (Retouch / Variation / Glasses / Images / Colors / Body) ── */}
              {clothingStyleGroup && (
                <section className="bg-slate-900/60 border-2 border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-inner animate-fade-in">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-sm font-bold text-white">3</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-semibold text-white">Fine-Tune Your Look</h3>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* LEFT: Retouch, Variation, Glasses */}
                    <div className="space-y-4">
                      {/* Retouch */}
                      <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3"><Droplet className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide font-bold" style={{ color: ORANGE }}>Retouch Level</p></div>
                        <div className="grid grid-cols-2 gap-2">
                          {['None','Natural','Polished','Airbrushed'].map((r) => (
                            <button key={r} type="button" onClick={() => handleRetouchChange(r as any)} className={`text-[11px] rounded-lg px-2.5 py-1.5 transition ${(config.retouchLevel||'None')===r ? 'border-2 border-indigo-500 bg-indigo-500/10 text-white' : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-indigo-400/60 hover:bg-slate-900'}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      {/* Variation */}
                      <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide font-bold" style={{ color: ORANGE }}>Variation</p></div>
                        <p className="text-[10px] text-slate-400 mb-3">How different each image will look.</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[{label:'Low',value:'low'},{label:'Medium',value:'medium'},{label:'High',value:'high'}].map((opt) => (
                            <button key={opt.value} type="button" onClick={() => setVariationLevel(opt.value as VariationLevel)} className={`text-[11px] rounded-lg px-2.5 py-1.5 transition ${variationLevel===opt.value ? 'border-2 border-indigo-500 bg-indigo-500/10 text-white' : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-indigo-400/60 hover:bg-slate-900'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      {/* Glasses */}
                      <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3"><Glasses className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide font-bold" style={{ color: ORANGE }}>Glasses</p></div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleKeepGlassesChange(true)} className={`flex-1 text-[11px] rounded-lg px-3 py-2 transition ${config.keepGlasses!==false ? 'border-2 border-indigo-500 bg-indigo-500/10 text-white' : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-indigo-400/60 hover:bg-slate-900'}`}>Same as photo</button>
                          <button type="button" onClick={() => handleKeepGlassesChange(false)} className={`flex-1 text-[11px] rounded-lg px-3 py-2 transition ${config.keepGlasses===false ? 'border-2 border-indigo-500 bg-indigo-500/10 text-white' : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-indigo-400/60 hover:bg-slate-900'}`}>Remove</button>
                        </div>
                      </div>
                    </div>
                    {/* RIGHT: Images for this Look, Brand Colors, Body Size */}
                    <div className="space-y-4">
                      {/* Images for this Look */}
                      <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3"><ImageIcon className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide font-bold" style={{ color: ORANGE }}>Images for this Look</p></div>
                        <div className="flex items-center gap-3">
                          <input type="range" min={1} max={10} step={1} value={imageCount} onChange={(e) => setImageCount(parseInt(e.target.value, 10))} className="flex-1 accent-indigo-500" />
                          <div className="w-8 text-center bg-slate-800 rounded px-1.5 py-0.5 text-xs font-bold text-white border border-slate-600">{imageCount}</div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Generating {imageCount} unique variation{imageCount !== 1 ? 's' : ''}.</p>
                      </div>
                      {/* Brand Colors */}
                      <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3"><Palette className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide font-bold" style={{ color: ORANGE }}>Brand Colors</p></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><p className="text-[10px] mb-1.5 text-slate-300">Primary</p>{renderColorPicker('primary', config.brandColor||'', handleBrandColorChange, 'Choose Primary')}</div>
                          <div><p className="text-[10px] mb-1.5 text-slate-300">Secondary</p>{renderColorPicker('secondary', config.secondaryBrandColor||'', handleSecondaryBrandColorChange, 'Choose Secondary')}</div>
                        </div>
                      </div>
                      {/* Body Size */}
                      <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide font-bold" style={{ color: ORANGE }}>Body Size</p></div>
                        <p className="text-[10px] text-slate-400 mb-3">0 = same as reference photo.</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400 w-6 text-right">-3</span>
                          <input type="range" min={-3} max={3} step={1} value={bodySizeOffset} onChange={(e) => setBodySizeOffset(parseInt(e.target.value,10))} className="flex-1 accent-indigo-500" />
                          <span className="text-[11px] text-slate-400 w-6">+3</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                          <span>Current: <span className="text-indigo-300">{bodySizeOffset}</span></span>
                          <button type="button" onClick={() => setBodySizeOffset(0)} className="text-[11px] text-indigo-300 hover:text-indigo-200 underline">Reset</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Save Look */}
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-700/60">
                    <div className="text-[11px] text-slate-400">Configure this Look, then click <span className="text-indigo-300 font-semibold">Save Look</span>.</div>
                    <Button type="button" onClick={handleAddOrUpdateLook} className="bg-indigo-600 hover:bg-indigo-500 text-xs">
                      {activeLookId ? <><Edit3 className="w-3 h-3 mr-1" />Update Look</> : <><Plus className="w-3 h-3 mr-1" />Save Look</>}
                    </Button>
                  </div>
                </section>
              )}

              {/* SECTION 4: CAMERA & COMPOSITION — collapsible */}
              {clothingStyleGroup && (
                <section className="bg-indigo-950/30 border border-indigo-900/60 rounded-2xl shadow-inner animate-fade-in overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCameraExpanded(prev => !prev)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-sm font-bold text-white">4</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Aperture className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-base font-semibold text-white">Camera & Composition</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 ml-7">Use these settings to fine tune your images.</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${cameraExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {cameraExpanded && (
                  <div className="px-6 pb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2"><Maximize className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide" style={{ color: ORANGE }}>Aspect Ratio</p><span className="text-[10px] text-slate-200 ml-1">Width : Height</span></div>
                      <div className="grid grid-cols-2 gap-2">
                        {['1:1','16:9','9:16','4:5'].map((ratio) => (
                          <button key={ratio} type="button" onClick={() => handleAspectRatioChange(ratio as AspectRatio)} className={`text-[11px] rounded-lg px-2.5 py-1.5 transition ${(config.aspectRatio||'1:1')===ratio ? 'border-2 border-indigo-500 bg-indigo-500/10 text-white' : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-indigo-400/60'}`}>{ratio}</button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2"><Focus className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide" style={{ color: ORANGE }}>Pose / Framing</p></div>
                      <div className="grid grid-cols-2 gap-2">
                        {['Headshot','Waist Up','Three-Quarter','Full Body'].map((frame) => (
                          <button key={frame} type="button" onClick={() => handleFramingChange(frame)} className={`text-[11px] rounded-lg px-2.5 py-1.5 transition ${(config.framing||'Waist Up')===frame ? 'border-2 border-indigo-500 bg-indigo-500/10 text-white' : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-indigo-400/60'}`}>{frame}</button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2"><Sun className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide" style={{ color: ORANGE }}>Lighting & Mood</p></div>
                      <div className="grid grid-cols-2 gap-2">
                        {['Polished Professional','Daylight','Cinematic','Dark & Moody'].map((m) => (
                          <button key={m} type="button" onClick={() => handleMoodChange(m)} className={`text-[11px] rounded-lg px-2.5 py-1.5 transition ${(config.mood||'Polished Professional')===m ? 'border-2 border-indigo-500 bg-indigo-500/10 text-white' : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-indigo-400/60'}`}>{m}</button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2"><Camera className="w-4 h-4 text-indigo-300" /><p className="text-[11px] uppercase tracking-wide" style={{ color: ORANGE }}>Camera Angle</p></div>
                      <div className="grid grid-cols-2 gap-2">
                        {['Eye Level','High Angle','Low Angle (Power)'].map((angle) => (
                          <button key={angle} type="button" onClick={() => handleCameraAngleChange(angle)} className={`text-[11px] rounded-lg px-2.5 py-1.5 transition ${(config.cameraAngle||'Eye Level')===angle ? 'border-2 border-indigo-500 bg-indigo-500/10 text-white' : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-indigo-400/60'}`}>{angle}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>
                  )}
                </section>
              )}


              {/* ── SECTION 5: SHOT LIST GENERATOR ─────────────────────────────── */}
              {clothingStyleGroup && (
                <section className="bg-emerald-950/30 border-2 border-emerald-900/40 rounded-2xl shadow-inner animate-fade-in overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShotListExpanded(prev => !prev)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-emerald-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-sm font-bold text-white">5</span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <ListChecks className="w-5 h-5 text-emerald-400" />
                          <h3 className="text-base font-semibold text-white">Personal Brand Shot List</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 ml-7">Tell us what you do — get a tailored list of brand photos to generate.</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${shotListExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {shotListExpanded && (
                    <div className="px-6 pb-6">
                      {/* Description input */}
                      <div className="mb-4">
                        <label className="block text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>Describe your work</label>
                        <textarea
                          value={shotListDescription}
                          onChange={e => setShotListDescription(e.target.value)}
                          placeholder="e.g. I'm a real estate agent in St. Louis specializing in luxury homes..."
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>
                      {/* Shot count selector */}
                      <div className="mb-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide mb-2 text-slate-400">How many shots?</p>
                        <div className="flex gap-2">
                          {([3,5,10] as const).map(n => (
                            <button key={n} type="button"
                              onClick={() => setShotListCount(n)}
                              className={`flex-1 text-sm font-bold rounded-lg py-2 border transition ${shotListCount===n ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-600/50'}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Generate button */}
                      <button
                        type="button"
                        onClick={generateShotList}
                        disabled={!shotListDescription.trim() || shotListLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed mb-4"
                      >
                        {shotListLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating your shot list…</> : <><Sparkle className="w-4 h-4" />Generate Shot List</>}
                      </button>
                      {shotListError && <p className="text-xs text-red-400 mb-3">{shotListError}</p>}

                      {/* Shot list results */}
                      {shotList.length > 0 && (
                        <div className="space-y-2">
                          {shotList.map((shot, i) => (
                            <div key={shot.number} className="bg-slate-900/70 border border-slate-700 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() => toggleShotCard(shot.number)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="h-6 w-6 rounded-full bg-emerald-700/60 border border-emerald-600/40 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[10px] font-bold text-emerald-200">{shot.number}</span>
                                </div>
                                <span className="flex-1 text-xs font-semibold text-white">{shot.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-slate-400">{shot.mood}</span>
                                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${shotListExpandedCards.has(shot.number) ? 'rotate-180' : ''}`} />
                              </button>
                              {shotListExpandedCards.has(shot.number) && (
                                <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 space-y-2">
                                  <p className="text-[11px] text-slate-300 leading-relaxed">{shot.scene}</p>
                                  <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2.5">
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1">Why this shot</p>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">{shot.why}</p>
                                  </div>
                                  <div className="bg-slate-950/60 border border-slate-700 rounded-lg p-2.5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Prompt</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-mono">{shot.prompt}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Generate All */}
                          <div className="pt-3 border-t border-slate-700/50">
                            <button
                              type="button"
                              onClick={handleGenerateAllShots}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white transition"
                            >
                              <Zap className="w-4 h-4" />
                              Generate All {shotList.length} Shots
                            </button>
                            <p className="text-[10px] text-slate-500 text-center mt-1.5">Uses {shotList.length} credit{shotList.length !== 1 ? 's' : ''} · 1 image per shot</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-inner">
            <div className="flex items-center gap-2 mb-4">
              <LayoutTemplate className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Saved Looks ({looks.length}/{MAX_LOOKS})</h3>
            </div>
            {looks.length === 0 ? (
              <p className="text-xs text-slate-500">No Looks created yet. Configure a Look on the left, then click "Save Look".</p>
            ) : (
              <div className="space-y-3">
                {looks.map((look) => (
                  <div key={look.id} className={`border rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-3 ${activeLookId===look.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 bg-slate-900/40'}`}>
                    <div>
                      <p className="font-semibold text-white mb-0.5">{look.label}</p>
                      <p className="text-slate-300 mb-0.5">{look.clothingOption} – {look.sceneName}</p>
                      <p className="text-[11px] text-slate-500">{look.imageCount} image{look.imageCount>1?'s':''} · {look.config.framing}, {look.config.aspectRatio} · {look.config.mood} · Variation: {look.variationLevel||DEFAULT_VARIATION_LEVEL} · Body: {typeof look.bodySizeOffset==='number'?look.bodySizeOffset:DEFAULT_BODY_OFFSET}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => handleEditLook(look)} className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200"><Edit3 className="w-3 h-3" /></button>
                      <button type="button" onClick={() => handleDeleteLook(look.id)} className="p-1.5 rounded-full bg-slate-800 hover:bg-red-600/80 text-slate-200"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-inner space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-400">Total images to generate: <span className="text-indigo-300 font-semibold">{totalImages}</span></p>
                <p className="text-xs text-slate-400">Looks saved: <span className="text-indigo-300 font-semibold">{looks.length} / {MAX_LOOKS}</span></p>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>Each image uses <span className="font-semibold">1 credit</span>.</span>
              </div>
            </div>
            {!aboutYouComplete && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Complete "About You" above to continue.
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onBack} className="border-slate-600 hover:bg-slate-800/50 text-xs">Back</Button>
              <Button onClick={handleContinue} disabled={!canContinue} className="bg-indigo-600 hover:bg-indigo-500 text-xs disabled:opacity-50">Continue</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
