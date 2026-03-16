import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { generateShotList as generateShotListFromGemini } from '../services/geminiService.ts';

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
  creditsLoaded?: boolean;
}

type CreationMode = 'guided' | 'expert';

const MAX_LOOKS = 5;

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

// ── Design tokens ───────────────────────────────────────────────────────────
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

// Shared style helpers
const pill = (active: boolean) => ({
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: 6,
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
  background: active ? T.purpleGrad : T.panel,
  border: `1px solid ${active ? 'rgba(76,29,149,0.6)' : T.panelBorder}`,
  color: active ? T.white : T.white60,
  boxShadow: active ? '0 4px 16px rgba(46,16,101,0.35)' : 'none',
});

const sectionStyle = (unlocked: boolean) => ({
  borderRadius: 16,
  overflow: 'hidden',
  border: `1px solid ${unlocked ? T.panelBorder : 'rgba(255,255,255,0.04)'}`,
  background: unlocked ? T.panel : 'rgba(255,255,255,0.01)',
  opacity: unlocked ? 1 : 0.45,
  transition: 'all 0.2s',
  marginBottom: 24,
});

const sectionHeaderStyle = (unlocked: boolean) => ({
  width: '100%',
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  padding: '20px 24px',
  background: 'none',
  border: 'none',
  cursor: unlocked ? 'pointer' : 'not-allowed',
  transition: 'background 0.15s',
});

// ── SectionBlock — defined OUTSIDE SettingsStep to prevent remount on state changes ──
const SectionBlock: React.FC<{
  num: number; icon: React.ReactNode; title: string; badge?: string; unlocked: boolean;
  isOpen: boolean; onToggle: () => void; hint?: string; rightEl?: React.ReactNode; children: React.ReactNode;
}> = ({ num, icon, title, badge, unlocked, isOpen, onToggle, hint, rightEl, children }) => (
  <div style={sectionStyle(unlocked)}>
    <button
      type="button"
      disabled={!unlocked}
      onClick={onToggle}
      style={sectionHeaderStyle(unlocked)}
      onMouseOver={e => { if (unlocked) (e.currentTarget as HTMLElement).style.background = T.panelHover; }}
      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: unlocked ? T.purpleGrad : T.panel,
          border: `1px solid ${unlocked ? 'rgba(76,29,149,0.5)' : T.panelBorder}`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{num}</span>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: T.purple }}>{icon}</span>
            <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 400, color: T.white }}>{title}</span>
            {badge && <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 100, background: T.tealDim, border: `1px solid ${T.tealBorder}`, color: T.teal }}>{badge}</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {rightEl}
        {hint && !unlocked && <span style={{ fontSize: 11, color: T.white40 }}>{hint}</span>}
        <ChevronDown style={{ width: 16, height: 16, color: T.white40, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>
    </button>
    {isOpen && <div style={{ padding: '0 24px 24px' }}>{children}</div>}
  </div>
);

export const SettingsStep: React.FC<SettingsStepProps> = ({
  config,
  onChange,
  onNext,
  onBack,
  credits,
  creditsLoaded = true,
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
  const [sec1Open, setSec1Open] = useState(false);
  const [sec2Open, setSec2Open] = useState(false);
  const [sec3Open, setSec3Open] = useState(false);
  const [sec4Open, setSec4Open] = useState(false);
  const [sec5Open, setSec5Open] = useState(false);
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
  const [showAboutYouWarning, setShowAboutYouWarning] = useState(false);
  const [shotListExpanded, setShotListExpanded] = useState(false);
  const [shotListDescription, setShotListDescriptionRaw] = useState(() => {
    try { return localStorage.getItem('vl_shotlist_description') || ''; } catch { return ''; }
  });
  const setShotListDescription = (val: string) => {
    setShotListDescriptionRaw(val);
    try { localStorage.setItem('vl_shotlist_description', val); } catch {}
  };
  const [shotListCount, setShotListCount] = useState<3|5|10>(5);
  const [showShotListTemplate, setShowShotListTemplate] = useState(false);
  const [shotListTemplateFields, setShotListTemplateFields] = useState({
    industry: '', clients: '', outcome: '', style: '', unique: '',
  });
  const shotListTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [shotListLoading, setShotListLoading] = useState(false);
  const [shotList, setShotList] = useState<any[]>([]);
  const [shotListError, setShotListError] = useState<string|null>(null);
  const [shotListExpandedCards, setShotListExpandedCards] = useState<Set<number>>(new Set());
  const [showGenerateAllConfirm, setShowGenerateAllConfirm] = useState(false);
  const [pendingSingleShot, setPendingSingleShot] = useState<any>(null);
  const [shotImageCounts, setShotImageCounts] = useState<Record<number, number>>({});

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
    setActiveLookId(null);
    resetBuilder();
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

  const sectionRefs = {
    sec1: React.useRef<HTMLDivElement | null>(null),
    sec2: React.useRef<HTMLDivElement | null>(null),
    sec3: React.useRef<HTMLDivElement | null>(null),
    sec4: React.useRef<HTMLDivElement | null>(null),
    sec5: React.useRef<HTMLDivElement | null>(null),
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  useEffect(() => {
    if (aboutYouComplete && !sec1Open) { setSec1Open(true); }
  }, [aboutYouComplete]);

  useEffect(() => {
    if (clothingOption && !sec2Open) { setSec2Open(true); scrollToSection(sectionRefs.sec2); }
  }, [clothingOption]);

  useEffect(() => {
    if (sceneId && sceneId !== 'custom' && !sec3Open) { setSec3Open(true); scrollToSection(sectionRefs.sec3); }
  }, [sceneId]);

  const handleContinue = () => {
    if (!config.genderPresentation || !config.ageRange) {
      setShowAboutYouWarning(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    let stylesToUse: StyleOption[] = [];
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
    const baseConfig: GenerationConfig = { ...config, retouchLevel: config.retouchLevel || 'None', variationsCount: 1 };
    onNext(stylesToUse, baseConfig);
  };

  const buildShotListFromTemplate = () => {
    const { industry, clients, outcome, style, unique } = shotListTemplateFields;
    const parts: string[] = [];
    if (industry) parts.push(`I work in ${industry}`);
    if (clients) parts.push(`working with ${clients}`);
    if (outcome) parts.push(`helping them ${outcome}`);
    if (style) parts.push(`my personal style is ${style}`);
    if (unique) parts.push(`what makes my brand unique is ${unique}`);
    const built = parts.length ? parts.join(', ') + '.' : '';
    setShotListDescription(built);
    setShowShotListTemplate(false);
    setTimeout(() => shotListTextareaRef.current?.focus(), 100);
  };

  const generateShotList = async () => {
    if (!shotListDescription.trim() || shotListLoading) return;
    setShotListLoading(true);
    setShotListError(null);
    setShotList([]);
    setShotListExpandedCards(new Set());
    try {
      const shots = await generateShotListFromGemini(shotListDescription, shotListCount);
      setShotList(shots);
    } catch (err) {
      console.error("Shot list error:", err);
      setShotListError("Something went wrong generating your shot list. Please try again.");
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

  const parseAspectRatioFromPrompt = (prompt: string): AspectRatio => {
    const p = prompt.toLowerCase();
    if (p.match(/16\s*[x:]\s*9/)) return '16:9';
    if (p.match(/9\s*[x:]\s*16/)) return '9:16';
    if (p.match(/4\s*[x:]\s*5/)) return '4:5';
    if (p.match(/1\s*[x:]\s*1|square/)) return '1:1';
    return config.aspectRatio || '1:1';
  };

  const confirmGenerateAllShots = () => {
    setShowGenerateAllConfirm(false);
    if (pendingSingleShot) {
      const shot = pendingSingleShot;
      setPendingSingleShot(null);
      const shotStyle: StyleOption = {
        id: `shot-${shot.number}`,
        name: shot.name,
        description: shot.scene,
        promptModifier: shot.prompt,
        thumbnailColor: '#111827',
        imageCount: shotImageCounts[shot.number] || 1,
        overrides: { expertPrompt: shot.prompt, aspectRatio: parseAspectRatioFromPrompt(shot.prompt) },
      };
      const lookStyles: StyleOption[] = looks.map((look) => ({
        id: look.id, name: look.label, description: `${look.clothingOption} – ${look.sceneName}`,
        promptModifier: look.scenePrompt, thumbnailColor: '#111827', imageCount: look.imageCount,
        clothingDescription: look.clothingOption, variationLevel: look.variationLevel, bodySizeOffset: look.bodySizeOffset,
        overrides: { ...look.config, bodySizeOffset: look.bodySizeOffset },
      }));
      onNext([shotStyle, ...lookStyles], { ...config, retouchLevel: config.retouchLevel || 'None', variationsCount: 1 });
      return;
    }
    const shotStyles: StyleOption[] = shotList.map((shot) => ({
      id: `shot-${shot.number}`, name: shot.name, description: shot.scene, promptModifier: shot.prompt,
      thumbnailColor: '#111827', imageCount: shotImageCounts[shot.number] || 1,
      overrides: { expertPrompt: shot.prompt, aspectRatio: parseAspectRatioFromPrompt(shot.prompt) },
    }));
    const lookStyles: StyleOption[] = looks.map((look) => ({
      id: look.id, name: look.label, description: `${look.clothingOption} – ${look.sceneName}`,
      promptModifier: look.scenePrompt, thumbnailColor: '#111827', imageCount: look.imageCount,
      clothingDescription: look.clothingOption, variationLevel: look.variationLevel, bodySizeOffset: look.bodySizeOffset,
      overrides: { ...look.config, bodySizeOffset: look.bodySizeOffset },
    }));
    onNext([...shotStyles, ...lookStyles], { ...config, retouchLevel: config.retouchLevel || 'None', variationsCount: 1 });
  };

  const handleGenerateSingleShot = (shot: any) => {
    if (!aboutYouComplete) { setShowAboutYouWarning(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setPendingSingleShot(shot);
    setShowGenerateAllConfirm(true);
  };

  const canContinue = aboutYouComplete && looks.length > 0;

  // ── Color picker ───────────────────────────────────────────────
  const renderColorPicker = (
    type: 'primary' | 'secondary' | 'customBg',
    currentValue: string,
    onChangeFn: (val: string) => void,
    placeholder: string
  ) => {
    const isActive = activeColorPicker === type;
    return (
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setActiveColorPicker(isActive ? null : type)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            background: T.panel, border: `1px solid ${isActive ? T.purple : T.panelBorder}`,
            borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer',
            color: currentValue ? T.white : T.white40, transition: 'all 0.15s',
            boxShadow: isActive ? `0 0 0 1px ${T.purple}` : 'none',
          }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: '50%', border: `1px solid ${T.white20}`,
            backgroundColor: currentValue || 'transparent',
            backgroundImage: currentValue ? 'none' : 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%)',
            backgroundSize: '4px 4px',
            flexShrink: 0,
          }} />
          <span>{currentValue || placeholder}</span>
        </button>
        {isActive && (
          <div ref={colorPickerRef} style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, zIndex: 50,
            background: '#0D0F16', border: `1px solid ${T.panelBorder}`, borderRadius: 16,
            boxShadow: '0 24px 48px rgba(0,0,0,0.6)', padding: 16, width: 256,
          }}>
            <button type="button" onClick={() => { onChangeFn(''); setActiveColorPicker(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', marginBottom: 12, fontSize: 12, background: 'none', border: `1px solid ${T.panelBorder}`, borderRadius: 8, color: T.white40, cursor: 'pointer' }}>
              <Ban style={{ width: 12, height: 12, color: T.red }} /><span>None / Clear</span>
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 14 }}>
              {PRESET_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => { onChangeFn(color); setActiveColorPicker(null); }}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${T.panelBorder}`, backgroundColor: color, cursor: 'pointer', position: 'relative', transition: 'transform 0.1s' }}>
                  {currentValue === color && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check style={{ width: 14, height: 14, color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} /></div>}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: T.white40, fontSize: 12 }}>#</span>
                <input type="text" value={currentValue.replace('#', '')} onChange={(e) => onChangeFn(`#${e.target.value}`)} placeholder="HEX"
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, paddingLeft: 20, paddingRight: 8, paddingTop: 6, paddingBottom: 6, fontSize: 12, color: T.white, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button type="button" onClick={() => { pickColorWithEyeDropper(type as any); setActiveColorPicker(null); }} disabled={!isEyeDropperSupported}
                style={{ padding: '6px 8px', background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 8, color: T.white60, cursor: 'pointer' }} title="Pick from screen">
                <Pipette style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Confirm modal ──────────────────────────────────────────────
  const confirmModal = showGenerateAllConfirm ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#0D0F16', border: `1px solid ${T.panelBorder}`, borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', margin: '0 16px', boxShadow: '0 48px 96px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.tealDim, border: `1px solid ${T.tealBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap style={{ width: 20, height: 20, color: T.teal }} />
          </div>
          <h3 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, color: T.white, margin: 0 }}>
            {pendingSingleShot ? `Generate "${pendingSingleShot.name}"?` : 'Ready to Generate?'}
          </h3>
        </div>
        <p style={{ fontSize: 13, color: T.white60, marginBottom: 14, lineHeight: 1.6 }}>
          {pendingSingleShot
            ? <span>This will generate <strong style={{ color: T.white }}>{shotImageCounts[pendingSingleShot.number] || 1} image{(shotImageCounts[pendingSingleShot.number] || 1) !== 1 ? 's' : ''}</strong> for this shot{looks.length > 0 ? <span> plus your <strong style={{ color: T.white }}>{looks.length} Saved Look{looks.length !== 1 ? 's' : ''}</strong></span> : ''}.</span>
            : <span>This will generate your <strong style={{ color: T.white }}>{shotList.length} Shot List image{shotList.length !== 1 ? 's' : ''}</strong>{looks.length > 0 ? <span> plus your <strong style={{ color: T.white }}>{looks.length} Saved Look{looks.length !== 1 ? 's' : ''}</strong></span> : ''}.</span>
          }
        </p>
        <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 12, color: T.white60 }}>
          {pendingSingleShot
            ? <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>"{pendingSingleShot.name}"</span><span style={{ color: T.white, fontWeight: 600 }}>{shotImageCounts[pendingSingleShot.number] || 1} credit{(shotImageCounts[pendingSingleShot.number] || 1) !== 1 ? 's' : ''}</span></div>
            : shotList.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shot List images</span><span style={{ color: T.white, fontWeight: 600 }}>{shotList.map((s) => shotImageCounts[s.number] || 1).reduce((a,b)=>a+b,0)} credits</span></div>
          }
          {looks.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span>Saved Looks</span><span style={{ color: T.white, fontWeight: 600 }}>{looks.reduce((s,l) => s + l.imageCount, 0)} credits</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.panelBorder}`, paddingTop: 8, marginTop: 8 }}>
            <span style={{ color: T.white80, fontWeight: 500 }}>Total</span>
            <span style={{ color: T.purple, fontWeight: 700 }}>
              {(pendingSingleShot ? (shotImageCounts[pendingSingleShot.number] || 1) : shotList.map((s) => shotImageCounts[s.number] || 1).reduce((a,b)=>a+b,0)) + looks.reduce((s,l) => s + l.imageCount, 0)} credits
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => { setShowGenerateAllConfirm(false); setPendingSingleShot(null); }}
            style={{ flex: 1, padding: '12px', borderRadius: 11, border: `1px solid ${T.panelBorder}`, background: 'none', color: T.white60, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            Cancel
          </button>
          <button type="button" onClick={confirmGenerateAllShots}
            disabled={!creditsLoaded}
            style={{ flex: 1, padding: '12px', borderRadius: 11, background: creditsLoaded ? T.tealDim : 'rgba(255,255,255,0.05)', border: `1px solid ${T.tealBorder}`, color: creditsLoaded ? T.teal : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, cursor: creditsLoaded ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            {creditsLoaded ? 'Generate Now' : 'Loading…'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ width: '100%', maxWidth: 1080, margin: '0 auto', paddingBottom: 80 }} className="animate-fade-in">
      {confirmModal}

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 100, padding: '4px 12px', marginBottom: 14, background: T.purpleDim, border: `1px solid ${T.purpleBorder}`, color: T.purple, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Step 2 of 4
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 40, fontWeight: 400, color: T.white, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 10px' }}>
          Design your Photoshoot
        </h1>
        <p style={{ fontSize: 15, fontWeight: 300, color: T.white40, margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
          Build your Looks by choosing a clothing style, background scene, and fine-tuning details.
        </p>
      </div>

      {/* Shot List banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderRadius: 14, marginBottom: 28, background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(76,29,149,0.08))', border: `1px solid ${T.amberBorder}` }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.amberDim, border: `1px solid ${T.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ListChecks style={{ width: 16, height: 16, color: T.amber }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.amber, margin: '0 0 2px' }}>Try the Shot List Generator ↓</p>
          <p style={{ fontSize: 12, color: T.white40, margin: 0 }}>Describe your profession and we'll build a custom shot list tailored to your brand. Scroll to Section 5.</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <style>{`.settings-grid { grid-template-columns: 1fr 300px; } @media (max-width: 960px) { .settings-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* ── LEFT COLUMN ── */}
        <div>

          {/* ABOUT YOU */}
          <div style={{ ...sectionStyle(true), border: showAboutYouWarning && !aboutYouComplete ? `1px solid rgba(239,68,68,0.5)` : aboutYouComplete ? `1px solid rgba(13,148,136,0.25)` : `1px solid ${T.panelBorder}`, opacity: 1 }}>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: aboutYouComplete ? T.tealDim : T.amberDim, border: `1px solid ${aboutYouComplete ? T.tealBorder : T.amberBorder}` }}>
                    {aboutYouComplete
                      ? <Check style={{ width: 16, height: 16, color: T.teal }} />
                      : <User style={{ width: 16, height: 16, color: T.amber }} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User style={{ width: 16, height: 16, color: T.purple }} />
                    <span style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 400, color: T.white }}>About You</span>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', borderRadius: 100, background: T.redDim, border: `1px solid ${T.redBorder}`, color: T.red }}>Required</span>
              </div>

              {showAboutYouWarning && !aboutYouComplete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: T.redDim, border: `1px solid ${T.redBorder}`, borderRadius: 10, marginBottom: 16, fontSize: 12, color: T.red }}>
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  Please select your gender presentation and age range before continuing.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Gender */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, marginBottom: 8 }}>Gender Presentation</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[{ value: 'woman', label: 'Woman' }, { value: 'man', label: 'Man' }, { value: 'nonbinary', label: 'Non-binary' }].map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => { updateConfig({ genderPresentation: opt.value as any, includeRing: false }); setShowAboutYouWarning(false); }}
                        style={pill(config.genderPresentation === opt.value)}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* Age Range */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, marginBottom: 8 }}>Age Range</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {AGE_RANGES.map((range) => (
                      <button key={range} type="button"
                        onClick={() => { updateConfig({ ageRange: range as any }); setShowAboutYouWarning(false); }}
                        style={pill(config.ageRange === range)}
                      >{range}</button>
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, marginBottom: 8 }}>
                    Hair Color <span style={{ color: T.white40, textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {HAIR_COLORS.map((hair) => {
                      const isActive = config.hairColor === hair.label;
                      return (
                        <button key={hair.label} type="button"
                          onClick={() => updateConfig({ hairColor: isActive ? undefined : hair.label })}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: isActive ? T.purpleDim : T.panel, border: `1px solid ${isActive ? T.purpleBorder : T.panelBorder}`, color: isActive ? T.white : T.white60 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: hair.color, border: `1px solid rgba(255,255,255,0.15)`, flexShrink: 0 }} />
                          {hair.label}
                          {isActive && <Check style={{ width: 10, height: 10, color: T.purple }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ring */}
                {config.genderPresentation && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, marginBottom: 8 }}>
                      Wedding Ring <span style={{ color: T.white40, textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span>
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => updateConfig({ includeRing: false })} style={pill(!config.includeRing)}>None (default)</button>
                      <button type="button" onClick={() => updateConfig({ includeRing: true })} style={pill(!!config.includeRing)}>
                        {config.genderPresentation === 'woman' ? '💍 Diamond ring + band' : config.genderPresentation === 'man' ? '💍 Gold wedding band' : '💍 Elegant band'}
                      </button>
                    </div>
                    {config.includeRing && <p style={{ fontSize: 11, color: T.white40, marginTop: 6 }}>{ringLabel()}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {creationMode === 'guided' && (
            <>
              {/* SECTION 1 — Clothing Style */}
              <div ref={sectionRefs.sec1}>
                <SectionBlock num={1} icon={<Briefcase style={{ width: 16, height: 16 }} />} title="Clothing Style" unlocked={aboutYouComplete}
                  isOpen={sec1Open} onToggle={() => aboutYouComplete && setSec1Open(p => !p)}
                  hint="Complete About You first"
                  badge={clothingStyleGroup || undefined}
                  rightEl={clothingStyleGroup && sec1Open ? (
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleSurpriseMe(); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.purple, background: T.purpleDim, border: `1px solid ${T.purpleBorder}`, borderRadius: 100, padding: '4px 12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <Shuffle style={{ width: 11, height: 11 }} />Surprise Me
                    </button>
                  ) : undefined}
                >
                  {/* Style group tiles */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }} className="style-grid">
                    <style>{`@media (max-width: 600px) { .style-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
                    {Object.entries(BRAND_DEFINITIONS).map(([key, brand]) => {
                      const isActive = clothingStyleGroup === key;
                      const iconTypeMap: Record<string, React.ReactNode> = {
                        briefcase: <Briefcase style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />,
                        building:  <Aperture style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />,
                        mic:       <Sparkles style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />,
                        coffee:    <Sun style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />,
                        sparkles:  <Sparkles style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />,
                        camera:    <Camera style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />,
                        leaf:      <Focus style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />,
                        heart:     <Droplet style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />,
                      };
                      const iconNode = iconTypeMap[(brand as any).iconType] || <Briefcase style={{ width: 18, height: 18, color: isActive ? T.white : T.purple }} />;
                      return (
                        <button key={key} type="button" onClick={() => handleClothingStyleGroupSelect(key)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s', background: isActive ? T.purpleGrad : T.panel, border: `1px solid ${isActive ? 'rgba(76,29,149,0.5)' : T.panelBorder}`, boxShadow: isActive ? '0 8px 24px rgba(46,16,101,0.35)' : 'none' }}>
                          <div style={{ marginBottom: 10, padding: 8, borderRadius: '50%', background: isActive ? 'rgba(255,255,255,0.15)' : T.panelHover }}>
                            {iconNode}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 500, color: isActive ? T.white : T.white60 }}>{(brand as any).label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Clothing choice — inline */}
                  {clothingStyleGroup && (
                    <div style={{ paddingTop: 18, borderTop: `1px solid ${T.panelBorder}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <LayoutTemplate style={{ width: 14, height: 14, color: T.purple }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: T.white }}>Clothing Choice</span>
                      </div>
                      {!isCustomClothing ? (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {BRAND_DEFINITIONS[clothingStyleGroup]?.clothingOptions.map((group: any) => (
                              <div key={group.category}>
                                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, marginBottom: 8 }}>{group.category}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {group.items.map((item: any) => (
                                    <button key={item} type="button" onClick={() => handleClothingOptionSelect(clothingStyleGroup, item)} style={pill(clothingOption === item)}>{item}</button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <button onClick={handleCustomClothingToggle}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 16, padding: '12px', borderRadius: 10, border: `1px dashed ${T.panelBorder}`, background: 'none', color: T.white40, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = T.purple; (e.currentTarget as HTMLElement).style.color = T.purple; }}
                            onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = T.panelBorder; (e.currentTarget as HTMLElement).style.color = T.white40; }}>
                            <Plus style={{ width: 14, height: 14 }} />Add Your Own Outfit
                          </button>
                        </>
                      ) : (
                        <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.white, textTransform: 'uppercase' }}>Custom Outfit</span>
                            <button onClick={() => setIsCustomClothing(false)} style={{ fontSize: 11, color: T.purple, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Back to presets</button>
                          </div>
                          <textarea value={customClothingText} onChange={handleCustomClothingTextChange} placeholder="Describe the outfit in detail..."
                            style={{ width: '100%', background: T.bg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: 10, fontSize: 12, color: T.white, minHeight: 80, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      )}
                    </div>
                  )}
                </SectionBlock>
              </div>

              {/* SECTION 2 — Background Scene */}
              <div ref={sectionRefs.sec2}>
                <SectionBlock num={2} icon={<Camera style={{ width: 16, height: 16 }} />} title="Background Scene" unlocked={!!clothingStyleGroup}
                  isOpen={sec2Open} onToggle={() => clothingStyleGroup && setSec2Open(p => !p)}
                  hint="Choose Clothing Style first"
                  badge={sceneName || undefined}
                >
                  {!isCustomBackground ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }} className="scene-grid">
                        <style>{`@media (max-width: 600px) { .scene-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
                        {BRAND_DEFINITIONS[clothingStyleGroup!]?.sceneOptions.map((scene: any) => {
                          const isActive = sceneId === scene.id;
                          return (
                            <button key={scene.id} type="button" onClick={() => handleSceneSelect(clothingStyleGroup!, scene.id, scene.name, scene.prompt)}
                              style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: `1px solid ${isActive ? T.purpleBorder : T.panelBorder}`, background: isActive ? T.purpleDim : T.panel, cursor: 'pointer', transition: 'all 0.15s', boxShadow: isActive ? `0 0 0 1px ${T.purpleDeep}` : 'none' }}>
                              <p style={{ fontSize: 12, fontWeight: 500, color: isActive ? T.white : T.white80, marginBottom: 4 }}>{scene.name}</p>
                              <p style={{ fontSize: 10, color: T.white40, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{scene.prompt}</p>
                            </button>
                          );
                        })}
                      </div>
                      <button onClick={handleCustomBackgroundToggle}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 14, padding: '12px', borderRadius: 10, border: `1px dashed ${T.panelBorder}`, background: 'none', color: T.white40, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = T.purple; (e.currentTarget as HTMLElement).style.color = T.purple; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = T.panelBorder; (e.currentTarget as HTMLElement).style.color = T.white40; }}>
                        <Plus style={{ width: 14, height: 14 }} />Add Your Own Background
                      </button>
                    </>
                  ) : (
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.white, textTransform: 'uppercase' }}>Custom Background</span>
                        <button onClick={() => setIsCustomBackground(false)} style={{ fontSize: 11, color: T.purple, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Back to presets</button>
                      </div>
                      <div style={{ display: 'flex', gap: 4, background: T.bg, padding: 4, borderRadius: 8, width: 'fit-content', marginBottom: 14 }}>
                        {(['prompt','color','upload'] as const).map((mode) => (
                          <button key={mode} onClick={() => { setCustomBgMode(mode); updateCustomBackground(mode); }}
                            style={{ padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: customBgMode === mode ? T.purpleGrad : 'none', border: 'none', color: customBgMode === mode ? T.white : T.white40 }}>
                            {mode === 'prompt' ? 'Describe' : mode === 'color' ? 'Color' : 'Upload'}
                          </button>
                        ))}
                      </div>
                      {customBgMode === 'prompt' && (
                        <textarea value={customBgText} onChange={(e) => { setCustomBgText(e.target.value); setScenePrompt(e.target.value); updateConfig({ backgroundType: e.target.value }); }} placeholder="e.g. A futuristic mars colony interior..."
                          style={{ width: '100%', background: T.bg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: 10, fontSize: 12, color: T.white, minHeight: 80, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                      )}
                      {customBgMode === 'color' && (
                        <div style={{ width: '50%' }}>
                          {renderColorPicker('customBg', customBgColor, (color) => {
                            setCustomBgColor(color);
                            const prompt = `Solid background color: ${color}`;
                            setScenePrompt(prompt);
                            updateConfig({ backgroundType: prompt, customBackground: undefined });
                          }, 'Select Color')}
                        </div>
                      )}
                      {customBgMode === 'upload' && (
                        <div style={{ border: `2px dashed ${T.panelBorder}`, borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s' }}>
                          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                          {customBgImage ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                              <img src={customBgImage} alt="Preview" style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 6 }} />
                              <span style={{ fontSize: 12, color: T.teal }}>Image Loaded</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: T.white40 }}>
                              <Upload style={{ width: 22, height: 22 }} />
                              <span style={{ fontSize: 12 }}>Click to upload image</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </SectionBlock>
              </div>

              {/* SECTION 3 — Fine-Tune */}
              <div ref={sectionRefs.sec3}>
                <SectionBlock num={3} icon={<Sparkles style={{ width: 16, height: 16 }} />} title="Fine-Tune Your Look" badge="Optional" unlocked={!!sceneId}
                  isOpen={sec3Open} onToggle={() => sceneId && setSec3Open(p => !p)} hint="Choose a Background first">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="finetune-grid">
                    <style>{`@media (max-width: 600px) { .finetune-grid { grid-template-columns: 1fr !important; } }`}</style>

                    {/* Retouch */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Droplet style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Retouch Level</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {['None','Natural','Polished','Airbrushed'].map((r) => (
                          <button key={r} type="button" onClick={() => handleRetouchChange(r as any)} style={pill((config.retouchLevel||'None')===r)}>{r}</button>
                        ))}
                      </div>
                    </div>

                    {/* Variation */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Sparkles style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Variation</p>
                      </div>
                      <p style={{ fontSize: 10, color: T.white40, marginBottom: 10 }}>How different each image will look.</p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[{label:'Low',value:'low'},{label:'Medium',value:'medium'},{label:'High',value:'high'}].map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setVariationLevel(opt.value as VariationLevel)} style={{ ...pill(variationLevel===opt.value), flex: 1, justifyContent: 'center' }}>{opt.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Glasses */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Glasses style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Glasses</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => handleKeepGlassesChange(true)} style={{ ...pill(config.keepGlasses!==false), flex: 1, justifyContent: 'center' }}>Same as photo</button>
                        <button type="button" onClick={() => handleKeepGlassesChange(false)} style={{ ...pill(config.keepGlasses===false), flex: 1, justifyContent: 'center' }}>Remove</button>
                      </div>
                    </div>

                    {/* Images count */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <ImageIcon style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Images for this Look</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="range" min={1} max={10} step={1} value={imageCount} onChange={(e) => setImageCount(parseInt(e.target.value, 10))} style={{ flex: 1, accentColor: T.purple }} />
                        <div style={{ width: 32, textAlign: 'center', background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: '2px 0', fontSize: 13, fontWeight: 700, color: T.white }}>{imageCount}</div>
                      </div>
                      <p style={{ fontSize: 10, color: T.white40, marginTop: 6 }}>Generating {imageCount} unique variation{imageCount !== 1 ? 's' : ''}.</p>
                    </div>

                    {/* Brand Colors */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Palette style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Brand Colors</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><p style={{ fontSize: 10, color: T.white60, marginBottom: 6 }}>Primary</p>{renderColorPicker('primary', config.brandColor||'', handleBrandColorChange, 'Choose Primary')}</div>
                        <div><p style={{ fontSize: 10, color: T.white60, marginBottom: 6 }}>Secondary</p>{renderColorPicker('secondary', config.secondaryBrandColor||'', handleSecondaryBrandColorChange, 'Choose Secondary')}</div>
                      </div>
                    </div>

                    {/* Body Size */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <ImageIcon style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Body Size</p>
                      </div>
                      <p style={{ fontSize: 10, color: T.white40, marginBottom: 10 }}>0 = same as reference photo.</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: T.white40, width: 20, textAlign: 'right' }}>-3</span>
                        <input type="range" min={-3} max={3} step={1} value={bodySizeOffset} onChange={(e) => setBodySizeOffset(parseInt(e.target.value,10))} style={{ flex: 1, accentColor: T.purple }} />
                        <span style={{ fontSize: 11, color: T.white40, width: 20 }}>+3</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: T.white40 }}>Current: <span style={{ color: T.purple }}>{bodySizeOffset}</span></span>
                        <button type="button" onClick={() => setBodySizeOffset(0)} style={{ fontSize: 11, color: T.purple, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset</button>
                      </div>
                    </div>
                  </div>
                </SectionBlock>
              </div>

              {/* SECTION 4 — Camera & Composition */}
              <div ref={sectionRefs.sec4}>
                <SectionBlock num={4} icon={<Aperture style={{ width: 16, height: 16 }} />} title="Camera, Lighting & Composition" badge="Optional" unlocked={!!sceneId}
                  isOpen={sec4Open} onToggle={() => sceneId && setSec4Open(p => !p)} hint="Choose a Background first">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="camera-grid">
                    <style>{`@media (max-width: 600px) { .camera-grid { grid-template-columns: 1fr !important; } }`}</style>

                    {/* Aspect Ratio */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Maximize style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Aspect Ratio</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {['1:1','16:9','9:16','4:5'].map((ratio) => (
                          <button key={ratio} type="button" onClick={() => handleAspectRatioChange(ratio as AspectRatio)} style={pill((config.aspectRatio||'1:1')===ratio)}>{ratio}</button>
                        ))}
                      </div>
                    </div>

                    {/* Framing */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Focus style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Pose / Framing</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {['Headshot','Waist Up','Three-Quarter','Full Body'].map((frame) => (
                          <button key={frame} type="button" onClick={() => handleFramingChange(frame)} style={pill((config.framing||'Waist Up')===frame)}>{frame}</button>
                        ))}
                      </div>
                    </div>

                    {/* Mood */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Sun style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Lighting & Mood</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {['Polished Professional','Daylight','Cinematic','Dark & Moody'].map((m) => (
                          <button key={m} type="button" onClick={() => handleMoodChange(m)} style={pill((config.mood||'Polished Professional')===m)}>{m}</button>
                        ))}
                      </div>
                    </div>

                    {/* Camera Angle */}
                    <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Camera style={{ width: 13, height: 13, color: T.purple }} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, margin: 0 }}>Camera Angle</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {['Eye Level','High Angle','Low Angle (Power)'].map((angle) => (
                          <button key={angle} type="button" onClick={() => handleCameraAngleChange(angle)} style={pill((config.cameraAngle||'Eye Level')===angle)}>{angle}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionBlock>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: T.amberBorder }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: T.amberDim, border: `1px solid ${T.amberBorder}` }}>
                  <ListChecks style={{ width: 13, height: 13, color: T.amber }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.amber }}>Use the Shot List Generator to craft your perfect looks</span>
                </div>
                <div style={{ flex: 1, height: 1, background: T.amberBorder }} />
              </div>

              {/* SECTION 5 — Shot List */}
              <div ref={sectionRefs.sec5}>
                <SectionBlock num={5} icon={<ListChecks style={{ width: 16, height: 16 }} />} title="Personal Brand Shot List" badge="Optional" unlocked={aboutYouComplete}
                  isOpen={sec5Open} onToggle={() => aboutYouComplete && setSec5Open(p => !p)} hint="Complete About You first">

                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.amber, marginBottom: 6 }}>Describe your work</p>
                    <p style={{ fontSize: 12, color: T.white40, lineHeight: 1.6, margin: '0 0 10px 0' }}>
                      The more specific you are, the better your shot list. Include your industry, who you serve, your style, and what makes your brand unique.
                    </p>

                    {/* Fill-in-the-blank template */}
                    {!showShotListTemplate ? (
                      <button
                        type="button"
                        onClick={() => setShowShotListTemplate(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.purple, background: T.purpleDim, border: `1px solid ${T.purpleBorder}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', marginBottom: 10, transition: 'all 0.15s' }}
                      >
                        ✦ Use guided template
                      </button>
                    ) : (
                      <div style={{ marginBottom: 12, padding: '14px 16px', background: T.purpleDim, border: `1px solid ${T.purpleBorder}`, borderRadius: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: T.purple, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Fill in what applies — skip anything that doesn't fit</p>
                        {[
                          { key: 'industry', label: 'I work in…', placeholder: 'e.g. health coaching, real estate, executive consulting' },
                          { key: 'clients',  label: 'and work with…', placeholder: 'e.g. busy moms, small business owners, C-suite leaders' },
                          { key: 'outcome',  label: 'to help them…', placeholder: 'e.g. lose weight sustainably, sell their home faster, lead with confidence' },
                          { key: 'style',    label: 'My personal style is…', placeholder: 'e.g. polished but approachable, bold and colorful, minimal and modern' },
                          { key: 'unique',   label: 'What makes my brand unique…', placeholder: 'e.g. I\'m a former chef turned nutritionist, I work exclusively with women over 50' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} style={{ marginBottom: 9 }}>
                            <label style={{ display: 'block', fontSize: 11, color: T.purple, fontWeight: 600, marginBottom: 3 }}>{label}</label>
                            <input
                              type="text"
                              value={shotListTemplateFields[key as keyof typeof shotListTemplateFields]}
                              onChange={e => setShotListTemplateFields(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={placeholder}
                              style={{ width: '100%', background: T.bg, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: '8px 11px', fontSize: 12, color: T.white, outline: 'none', boxSizing: 'border-box' as const }}
                            />
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button type="button" onClick={buildShotListFromTemplate}
                            disabled={!Object.values(shotListTemplateFields).some(v => v.trim())}
                            style={{ flex: 1, padding: '9px 14px', background: T.purpleGrad, border: 'none', borderRadius: 8, color: T.white, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Build my description →
                          </button>
                          <button type="button" onClick={() => setShowShotListTemplate(false)}
                            style={{ padding: '9px 12px', background: 'transparent', border: `1px solid ${T.panelBorder}`, borderRadius: 8, color: T.white40, fontSize: 12, cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <textarea
                      ref={shotListTextareaRef}
                      value={shotListDescription}
                      onChange={e => setShotListDescription(e.target.value)}
                      placeholder="e.g. I'm a business coach in Atlanta who helps first-generation entrepreneurs scale past six figures..."
                      rows={3}
                      style={{ width: '100%', background: T.bg, border: `1px solid ${T.panelBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: T.white, resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, lineHeight: 1.5 }} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.white40, marginBottom: 8 }}>How many shots?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([3,5,10] as const).map(n => (
                        <button key={n} type="button" onClick={() => setShotListCount(n)}
                          style={{ ...pill(shotListCount===n), flex: 1, justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <button type="button" onClick={generateShotList} disabled={!shotListDescription.trim() || shotListLoading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600, cursor: shotListDescription.trim() && !shotListLoading ? 'pointer' : 'not-allowed', transition: 'all 0.15s', background: shotListDescription.trim() && !shotListLoading ? T.tealDim : T.panel, border: `1px solid ${shotListDescription.trim() && !shotListLoading ? T.tealBorder : T.panelBorder}`, color: shotListDescription.trim() && !shotListLoading ? T.teal : T.white40, opacity: !shotListDescription.trim() || shotListLoading ? 0.5 : 1 }}>
                    {shotListLoading ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Generating your shot list…</> : <><Sparkle style={{ width: 14, height: 14 }} />Generate Shot List</>}
                  </button>

                  {shotListError && <p style={{ fontSize: 12, color: T.red, marginBottom: 12 }}>{shotListError}</p>}

                  {shotList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {shotList.map((shot) => (
                        <div key={shot.number} style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 12, overflow: 'hidden' }}>
                          <button type="button" onClick={() => toggleShotCard(shot.number)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = T.panelHover}
                            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.tealDim, border: `1px solid ${T.tealBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: T.teal }}>{shot.number}</span>
                            </div>
                            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.white, textAlign: 'left' }}>{shot.name}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: T.panel, border: `1px solid ${T.panelBorder}`, color: T.white40 }}>{shot.mood}</span>
                            <ChevronDown style={{ width: 12, height: 12, color: T.white40, transition: 'transform 0.2s', transform: shotListExpandedCards.has(shot.number) ? 'rotate(180deg)' : 'none' }} />
                          </button>
                          {shotListExpandedCards.has(shot.number) && (
                            <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.panelBorder}` }}>
                              <p style={{ fontSize: 12, color: T.white60, lineHeight: 1.6, marginTop: 12, marginBottom: 10 }}>{shot.scene}</p>
                              <div style={{ background: T.tealDim, border: `1px solid ${T.tealBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.teal, marginBottom: 4 }}>Why this shot</p>
                                <p style={{ fontSize: 11, color: T.white60, lineHeight: 1.5 }}>{shot.why}</p>
                              </div>
                              <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: T.white40 }}>Prompt</p>
                                  <span style={{ fontSize: 10, color: T.white40, fontStyle: 'italic' }}>Edit to fine-tune</span>
                                </div>
                                <textarea value={shot.prompt}
                                  onChange={(e) => { const updated = shotList.map((s) => s.number === shot.number ? { ...s, prompt: e.target.value } : s); setShotList(updated); }}
                                  rows={4}
                                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: '8px 10px', fontSize: 10, color: T.white60, fontFamily: 'monospace', lineHeight: 1.5, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: T.white40 }}>Images</span>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {[1,2,3,4].map(n => (
                                      <button key={n} type="button" onClick={() => setShotImageCounts(prev => ({ ...prev, [shot.number]: n }))}
                                        style={{ width: 26, height: 26, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.1s', background: (shotImageCounts[shot.number] || 1) === n ? T.purpleGrad : T.panel, border: `1px solid ${(shotImageCounts[shot.number] || 1) === n ? T.purpleBorder : T.panelBorder}`, color: T.white }}>{n}</button>
                                    ))}
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleGenerateSingleShot(shot)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: T.tealDim, border: `1px solid ${T.tealBorder}`, color: T.teal, transition: 'all 0.15s' }}>
                                  <Zap style={{ width: 12, height: 12 }} />
                                  Generate · {shotImageCounts[shot.number] || 1} credit{(shotImageCounts[shot.number] || 1) !== 1 ? 's' : ''}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <div style={{ paddingTop: 12, borderTop: `1px solid ${T.panelBorder}` }}>
                        <button type="button" onClick={handleGenerateAllShots}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(13,148,136,0.2), rgba(76,29,149,0.2))', border: `1px solid ${T.tealBorder}`, color: T.white, transition: 'all 0.15s' }}>
                          <Zap style={{ width: 14, height: 14, color: T.teal }} />
                          Generate All {shotList.length} Shot{shotList.length !== 1 ? 's' : ''}{looks.length > 0 ? ` + ${looks.length} Saved Look${looks.length !== 1 ? 's' : ''}` : ''}
                        </button>
                        <p style={{ fontSize: 10, color: T.white40, textAlign: 'center', marginTop: 6 }}>
                          {shotList.map((s) => shotImageCounts[s.number] || 1).reduce((a,b)=>a+b,0) + looks.reduce((s,l) => s + l.imageCount, 0)} total credits
                          {looks.length > 0 ? ` · includes ${looks.length} saved look${looks.length !== 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </SectionBlock>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* AI Callout */}
          <div style={{ background: T.panel, border: `1px solid ${T.purpleBorder}`, borderRadius: 16, padding: 18, fontSize: 12, color: T.white60, lineHeight: 1.7 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.purple, marginBottom: 8 }}>✦ Before you design</p>
            <p style={{ margin: 0 }}>Create with precision. Every credit generates one image — new or edit. Remember, AI is not perfect, but you're always in control. Use VeraLooks' built-in tools to refine and edit your images until they're just right for you and your brand.</p>
          </div>

          {/* Saved Looks */}
          <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <LayoutTemplate style={{ width: 14, height: 14, color: T.purple }} />
              <span style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 400, color: T.white }}>Saved Looks ({looks.length}/{MAX_LOOKS})</span>
            </div>
            {looks.length === 0 ? (
              <p style={{ fontSize: 12, color: T.white40, lineHeight: 1.6 }}>No Looks saved yet. Choose your clothing, background, and click <span style={{ color: T.purple }}>Save Look</span> below.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {looks.map((look) => (
                  <div key={look.id} style={{ border: `1px solid ${activeLookId===look.id ? T.purpleBorder : T.panelBorder}`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: activeLookId===look.id ? T.purpleDim : T.panel }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{look.label}</p>
                      <p style={{ fontSize: 11, color: T.white60, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{look.clothingOption} – {look.sceneName}</p>
                      <p style={{ fontSize: 10, color: T.white40 }}>{look.imageCount} image{look.imageCount>1?'s':''} · {look.config.framing} · {look.config.aspectRatio}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button type="button" onClick={() => handleEditLook(look)} style={{ width: 28, height: 28, borderRadius: '50%', background: T.panel, border: `1px solid ${T.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Edit3 style={{ width: 11, height: 11, color: T.white60 }} />
                      </button>
                      <button type="button" onClick={() => handleDeleteLook(look.id)} style={{ width: 28, height: 28, borderRadius: '50%', background: T.panel, border: `1px solid ${T.panelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 style={{ width: 11, height: 11, color: T.white60 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Look button */}
          {(() => {
            const canSave = !!clothingStyleGroup && !!clothingOption && !!sceneId;
            return (
              <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 16, padding: 16 }}>
                {!canSave && (
                  <p style={{ fontSize: 11, color: T.white40, textAlign: 'center', marginBottom: 12 }}>
                    {!clothingStyleGroup ? 'Choose a Clothing Style to get started.' : !clothingOption ? 'Choose a clothing item next.' : 'Choose a Background Scene to unlock.'}
                  </p>
                )}
                <button type="button" onClick={handleAddOrUpdateLook} disabled={!canSave}
                  style={{ width: '100%', padding: '13px', borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed', transition: 'all 0.2s', background: canSave ? T.purpleGrad : T.panel, border: `1px solid ${canSave ? T.purpleBorder : T.panelBorder}`, color: canSave ? T.white : T.white40, boxShadow: canSave ? '0 8px 24px rgba(46,16,101,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {activeLookId
                    ? <><Edit3 style={{ width: 14, height: 14 }} />Update Look</>
                    : <><Plus style={{ width: 14, height: 14 }} />Save Look</>}
                </button>
              </div>
            );
          })()}

          {/* Stats + Continue */}
          <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 12, color: T.white60 }}>
              <span>Total images: <span style={{ color: T.purple, fontWeight: 600 }}>{totalImages}</span></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap style={{ width: 12, height: 12, color: T.amber }} />1 credit each
              </span>
            </div>
            {!aboutYouComplete && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: T.amberDim, border: `1px solid ${T.amberBorder}`, borderRadius: 8, marginBottom: 12, fontSize: 11, color: T.amber }}>
                <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
                Complete "About You" to continue.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onBack}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'none', border: `1px solid ${T.panelBorder}`, color: T.white60, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                Back
              </button>
              <button onClick={handleContinue} disabled={!canContinue}
                style={{ flex: 2, padding: '10px', borderRadius: 10, background: canContinue ? T.purpleGrad : T.panel, border: `1px solid ${canContinue ? T.purpleBorder : T.panelBorder}`, color: canContinue ? T.white : T.white40, fontSize: 12, fontWeight: 700, cursor: canContinue ? 'pointer' : 'not-allowed', transition: 'all 0.15s', boxShadow: canContinue ? '0 8px 24px rgba(46,16,101,0.4)' : 'none' }}>
                Continue
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(8,10,15,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${T.panelBorder}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {(() => {
          const canSave = !!clothingStyleGroup && !!clothingOption && !!sceneId;
          return (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, color: T.white40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {looks.length === 0 ? 'No Looks saved yet' : `${looks.length} Look${looks.length > 1 ? 's' : ''} · ${totalImages} image${totalImages !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button type="button" onClick={handleAddOrUpdateLook} disabled={!canSave}
                style={{ padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: canSave ? 'pointer' : 'not-allowed', background: canSave ? T.purpleGrad : T.panel, border: `1px solid ${canSave ? T.purpleBorder : T.panelBorder}`, color: canSave ? T.white : T.white40 }}>
                {activeLookId ? 'Update Look' : 'Save Look'}
              </button>
              <button onClick={handleContinue} disabled={!canContinue}
                style={{ padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: canContinue ? 'pointer' : 'not-allowed', background: canContinue ? T.purpleGrad : T.panel, border: `1px solid ${canContinue ? T.purpleBorder : T.panelBorder}`, color: canContinue ? T.white : T.white40, opacity: canContinue ? 1 : 0.5 }}>
                Continue
              </button>
            </>
          );
        })()}
      </div>
    </div>
  );
};
