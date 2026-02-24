export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '3:1' | '4:1';

export interface GenerationConfig {
  clothing: string;
  backgroundType: string;
  aspectRatio: AspectRatio;
  framing: string;         // 'Headshot' | 'Waist Up' | 'Three-Quarter' | 'Full Body'
  cameraAngle: string;     // 'Eye Level' | 'High Angle' | 'Low Angle'
  mood: string;            // 'Polished', 'Daylight', 'Cinematic', 'Moody'
  lighting: string;        // 'Studio', 'Window', etc.
  retouchLevel: 'None' | 'Natural' | 'Polished' | 'Airbrushed';
  variationsCount: number;
  clothingColor: string;
  brandColor?: string;     // Primary Hex Code
  secondaryBrandColor?: string; // Secondary Hex Code
  keepGlasses?: boolean;   // Explicit control for glasses
  expertPrompt?: string;   // For expert mode
  bodySizeOffset?: number; // -3 (Very Thin) to +3 (Heavy)
  customBackground?: string; // New: Base64 of uploaded background image
}

export interface LookConfig {
  id: string;
  label: string;
  clothingStyleGroup: string;
  clothingOption: string;
  sceneId: string;
  sceneName: string;
  scenePrompt: string;
  imageCount: number;
  variationLevel?: 'low' | 'medium' | 'high';
  bodySizeOffset?: number; 
  config: GenerationConfig; // Stores the full config for this specific look
  isSurprise: boolean;
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  thumbnailColor: string;
  imageCount?: number;
  clothingDescription?: string;
  variationLevel?: 'low' | 'medium' | 'high';
  bodySizeOffset?: number;
  // This allows each Look to carry its own unique settings (Lighting, Mood, Body, etc.)
  overrides?: Partial<GenerationConfig>; 
  genderPresentation?: 'woman' | 'man' | 'nonbinary';
  ageRange?: '18-29' | '30-44' | '45-59' | '60+';
  hairColor?: string;
  includeRing?: boolean;
}

export interface ReferenceImage {
  id: string;
  fileName: string;
  base64: string;
  createdAt: number;
  role: 'main' | 'sideLeft' | 'sideRight' | 'fullBody';
}

export interface MultiReferenceSet {
  main?: ReferenceImage;
  sideLeft?: ReferenceImage;
  sideRight?: ReferenceImage;
  fullBody?: ReferenceImage;
}

export interface GeneratedImage {
  id: string;
  originalUrl: string;
  imageUrl: string;
  styleName: string;
  styleId: string;
  createdAt: number;
  aspectRatio: AspectRatio;
}
export interface UploadedImage {
  id?: string;
  fileName?: string;
  mimeType: string;
  base64: string;
  data?: string;
  createdAt?: number; // <--- This fixes the error!
}

export interface BrandData {
  // We add '?' to make these optional, fixing the brandDefinitions errors
  brandColor?: string;
  secondaryBrandColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  [key: string]: any;
}
