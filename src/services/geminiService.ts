import { GenerationConfig, MultiReferenceSet } from "../types.ts";

export const generateBrandPhotoWithRefs = async (
  refs: MultiReferenceSet,
  stylePrompt: string,
  config: GenerationConfig,
  globalIndex: number = 0
): Promise<string> => {

  // --- FRAMING → tells the AI exactly how to crop the shot ---
  const framingMap: Record<string, string> = {
    'Headshot':       'tight head and shoulders portrait, face fills most of the frame, crop just below the chest',
    'Waist Up':       'waist-up portrait, head and torso visible, crop at the waist',
    'Three-Quarter':  'three-quarter length portrait, crop just below the knees, full upper body visible',
    'Full Body':      'full body portrait, entire person visible from head to toe, no cropping of feet',
  };
  const framingInstruction = framingMap[config.framing] || framingMap['Waist Up'];

  // --- MOOD/LIGHTING ---
  const moodMap: Record<string, string> = {
    'Polished Professional': 'clean, bright, professional studio lighting with soft even illumination and subtle shadows',
    'Daylight':              'natural daylight, soft window light, airy and fresh atmosphere',
    'Cinematic':             'cinematic lighting with rich contrast, dramatic side lighting, film-like quality',
    'Dark & Moody':          'moody low-key lighting, deep shadows, dramatic atmosphere, dark background tones',
  };
  const moodInstruction = moodMap[config.mood] || moodMap['Polished Professional'];

  // --- CAMERA ANGLE ---
  const angleMap: Record<string, string> = {
    'Eye Level':         'shot at eye level, neutral perspective',
    'High Angle':        'shot from slightly above eye level, looking slightly down at subject',
    'Low Angle (Power)': 'shot from slightly below eye level, looking slightly up at subject, conveys authority',
  };
  const angleInstruction = angleMap[config.cameraAngle] || angleMap['Eye Level'];

  // --- RETOUCH LEVEL ---
  const retouchMap: Record<string, string> = {
    'None':        'no retouching, completely natural skin with all pores, fine lines and natural texture fully visible',
    'Natural':     'light natural retouching, skin texture preserved, minor blemishes softened but pores and natural details remain',
    'Polished':    'professional retouching, smooth even skin tone, minor imperfections removed while keeping the person looking real',
    'Airbrushed':  'heavy airbrushed retouching, very smooth flawless skin',
  };
  const retouchInstruction = retouchMap[config.retouchLevel] || retouchMap['None'];

  // --- GLASSES ---
  const glassesInstruction = config.keepGlasses === false
    ? 'The subject is NOT wearing glasses.'
    : 'Keep glasses exactly as they appear in the reference photo if present.';

  // --- BRAND COLORS ---
  const colorInstruction = config.brandColor
    ? `Incorporate the brand color ${config.brandColor}${config.secondaryBrandColor ? ` and ${config.secondaryBrandColor}` : ''} subtly in the background or environment.`
    : '';

  // --- ASSEMBLE THE FULL PROMPT ---
  const headshotPrompt = `
A high-end professional commercial photograph.

FRAMING: ${framingInstruction}.
SUBJECT: Hyper-realistic portrait of the exact person in the reference image. Preserve their face, facial structure, skin tone, hair, and all identifying features precisely.
LIGHTING: ${moodInstruction}. Peter Hurley-style clamshell setup. Crisp catchlights in the eyes.
CAMERA: ${angleInstruction}. Shot on Hasselblad X2D, 85mm f/2.8 lens.
SKIN: ${retouchInstruction}. High-fidelity skin tones. Natural micro-texture on skin.
BACKGROUND: ${stylePrompt}.
GLASSES: ${glassesInstruction}
TEETH: Natural teeth — do not over-whiten or straighten beyond what is visible in the reference photo.
${colorInstruction}
STYLE: Sharp focus, 8k resolution, photorealistic, not illustrated, not AI-looking.
MOOD: Confident, approachable, and professional.
`.trim();

  // --- FORMAT IMAGE ---
  const rawBase64 = refs.main?.base64 || "";
  const imageDataUri = rawBase64.startsWith("data:")
    ? rawBase64
    : `data:image/jpeg;base64,${rawBase64}`;

  try {
    // 1. START the job
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: headshotPrompt,
        image: imageDataUri,
        aspect_ratio: config.aspectRatio
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("API Error response:", errData);
      throw new Error(errData.error || "Failed to start AI engine");
    }

    let prediction = await response.json();
    console.log("Prediction started:", prediction.id, "status:", prediction.status);

    // 2. POLLING LOOP: Check every 3 seconds
    let attempts = 0;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      if (attempts > 40) throw new Error("Generation timed out after 2 minutes");
      attempts++;
      console.log("VeraLooks Engine Status:", prediction.status, `(attempt ${attempts})`);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const checkResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction_id: prediction.id })
      });

      if (!checkResponse.ok) throw new Error("Failed to check AI status");
      prediction = await checkResponse.json();
    }

    // 3. FINISH
    if (prediction.status === 'succeeded') {
      return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    } else {
      throw new Error(prediction.error || "AI generation failed");
    }

  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};

export const generateBrandPhotoWithRefsSafe = generateBrandPhotoWithRefs;
export const generateBrandPhoto = generateBrandPhotoWithRefs;
