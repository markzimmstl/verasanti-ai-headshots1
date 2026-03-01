import { GoogleGenAI } from "@google/genai";
import {
  GenerationConfig,
  AspectRatio,
  MultiReferenceSet,
} from "../types.ts";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing VITE_GEMINI_API_KEY. Add it to your .env (VITE_GEMINI_API_KEY=...) and restart the dev server."
  );
}

export const getAiClient = () => {
  return new GoogleGenAI({ apiKey });
};

const IMAGE_MODEL = "gemini-2.5-flash-image";
const TEXT_MODEL = "gemini-2.5-flash";

const cleanBase64 = (dataUrl: string): string => {
  if (!dataUrl) return "";
  const parts = dataUrl.split(",");
  return parts.length === 2 ? parts[1] : dataUrl;
};

// Detect mime type from data URL prefix, default to jpeg
const getMimeType = (dataUrl: string): string => {
  if (!dataUrl) return "image/jpeg";
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : "image/jpeg";
};

// Build a safe inline image part — returns null if image data is empty/invalid
const makeInlinePart = (dataUrl: string): { inlineData: { mimeType: string; data: string } } | null => {
  if (!dataUrl) return null;
  const data = cleanBase64(dataUrl);
  if (!data || data.length < 100) return null; // reject obviously invalid data
  const mimeType = getMimeType(dataUrl);
  return { inlineData: { mimeType, data } };
};

const extractImagesFromParts = (parts: any[]): string[] => {
  console.log("Extracting images from parts:", parts);
  const images: string[] = [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
      images.push(dataUrl);
    }
  }
  return images;
};

const cropToTargetSize = async (
  base64Image: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  let targetW = 2048;
  let targetH = 2048;
  switch (aspectRatio) {
    case "1:1":  targetW = 2048; targetH = 2048; break;
    case "4:5":  targetW = 1638; targetH = 2048; break;
    case "9:16": targetW = 1152; targetH = 2048; break;
    case "16:9": targetW = 2048; targetH = 1152; break;
    case "3:1":  targetW = 2048; targetH = 682;  break;
    case "4:1":  targetW = 2048; targetH = 512;  break;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(base64Image); return; }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = canvas.width / 2 - (img.width / 2) * scale;
      const y = canvas.height / 2 - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => { resolve(base64Image); };
    img.src = base64Image;
  });
};

// Rule of Thirds composition variants, cycled by globalIndex
const getRuleOfThirdsVariant = (globalIndex: number): {
  placement: string;
  bodyAngle: string;
  gaze: string;
  negativeAddition: string;
} => {
  const variant = globalIndex % 3;
  if (variant === 0) {
    return {
      placement: "Position the subject on the LEFT THIRD of the frame. The subject occupies the left 40% of the image. The right 60% shows the scene/background with depth.",
      bodyAngle: "Body angled 30-45 degrees toward the RIGHT (toward center of frame). Feet and hips point left, shoulders and chest open toward the right/center.",
      gaze: "Eyes looking directly into the camera lens. Head turned slightly back toward camera from the body angle.",
      negativeAddition: " Do NOT center the subject in the frame. Do NOT have the subject face square-on to the camera.",
    };
  } else if (variant === 1) {
    return {
      placement: "Position the subject on the RIGHT THIRD of the frame. The subject occupies the right 40% of the image. The left 60% shows the scene/background with depth.",
      bodyAngle: "Body angled 30-45 degrees toward the LEFT (toward center of frame). Feet and hips point right, shoulders and chest open toward the left/center.",
      gaze: "Eyes looking directly into the camera lens. Head turned slightly back toward camera from the body angle.",
      negativeAddition: " Do NOT center the subject in the frame. Do NOT have the subject face square-on to the camera.",
    };
  } else {
    return {
      placement: "Position the subject SLIGHTLY LEFT OF CENTER — not fully centered, not on the far third. Create an asymmetric, editorial composition with more negative space on the right side.",
      bodyAngle: "Body at a 20-30 degree angle to the camera, creating a dynamic lean. Weight on one foot, slight hip shift. Not square to the camera.",
      gaze: "Eyes looking directly into the camera with confident, engaged expression.",
      negativeAddition: " Do NOT place the subject dead-center in the frame. Do NOT have the subject stand perfectly square and symmetrical to the camera.",
    };
  }
};

// BUILD PROMPT
const buildPrompt = (
  stylePrompt: string,
  config: GenerationConfig,
  globalIndex: number = 0
): string => {

  let framingInstruction = "";

  let negativeConstraints = `
   NEGATIVE PROMPT (CRITICAL): 
   - Do NOT generate multiple people. Do NOT create clones. No group photos. 
   - Avoid gender-inappropriate clothing artifacts (e.g., no neckties on women unless specified).
   - ABSOLUTELY NO VISIBLE LIGHTING EQUIPMENT.
   - Do NOT show: octaboxes, softboxes, umbrellas, light stands, c-stands, reflectors, diffusers, grids, scrims, or flash heads.
   - Do NOT show reflections of lighting equipment in windows, glasses, or glossy surfaces.
   - BACKGROUND SEPARATION RULE: Do NOT allow vertical lines, window frames, trees, poles, or columns to appear directly behind the subject's head.
   - CROPPING RULE: NEVER crop at a joint (knees, elbows, wrists, ankles). Always crop mid-limb or beyond.
   - FINGERS: Never cut off fingers. If hands are visible, all fingers must be fully within the frame. Same rule applies to toes (full body shots) and the top of the head.
   - Avoid "mergers" where background objects look like they are growing out of the subject's head.
   - The background must be the ENVIRONMENT ONLY. 
   - CLOTHING TEXT: No text, no logos, no lettering, no graphics on any garment.
   - (Exception: If the scene description specifically asks for a "photo studio set" with visible gear, ignore the lighting equipment constraint).
 `;
  // Glasses — default is to preserve whatever is in the reference photo
  const glassesConstraint = config.keepGlasses === false
    ? "   - REMOVE any glasses from the subject. Subject must have no eyewear.\n"
    : "   - GLASSES: Preserve exactly what the reference photo shows. If subject wears glasses, keep them. If not, add none.\n";

  negativeConstraints += glassesConstraint;

  let textureInstruction = "";
  if (config.retouchLevel === 'None') {
    textureInstruction = `
      ** CRITICAL TEXTURE & REALISM INSTRUCTION (NO RETOUCHING) **
      - CAPTURE AUTHENTIC SKIN TEXTURE: Visible natural pores, fine lines, vellus hair (peach fuzz), and subtle skin variation.
      - HIGH-FREQUENCY DETAIL: Preserve micro-contrast and organic tonal variation across the face.
      - OPTICAL REALISM: Skin must appear naturally imperfect, realistic, and optically true.
      - NO SMOOTHING: Absolutely NO beauty filters, NO plastic skin, NO airbrushed effect, NO blurred pores.
      - TEXTURE PRIORITY: You MUST render deep, sharp high-frequency skin details.
      - SENSOR NOISE: Allow subtle luminance noise to prevent the "plastic AI look".
      - PROHIBITED: Do not apply any "glamour glow" or "soft skin" filters.
   `;
    negativeConstraints += " plastic skin, waxy skin, airbrushed face, beauty filter, over-smoothed skin, blurred pores, CGI skin, hyper-perfect complexion, synthetic texture.";
  } else if (config.retouchLevel === 'Natural') {
    textureInstruction = "Skin should look healthy and clean but maintain natural texture. Slight retouching allowed but keep it realistic.";
  } else if (config.retouchLevel === 'Polished') {
    textureInstruction = "Commercial polished look. Smooth skin tone, reduced blemishes, but keep essential facial features intact.";
  } else if (config.retouchLevel === 'Airbrushed') {
    textureInstruction = "High-fashion magazine retouching. Very smooth, flawless complexion, perfected features.";
  }

  const lowerPrompt = (stylePrompt + (config.backgroundType || '')).toLowerCase();
  const isBoardroomContext = lowerPrompt.includes('boardroom') || lowerPrompt.includes('meeting room') || lowerPrompt.includes('conference room');
  const userRequestedScreen = lowerPrompt.match(/screen|monitor|tv|projector|display|presentation|slide/);

  let sceneOverride = "";
  let cameraReorientation = "";

  if (isBoardroomContext && !userRequestedScreen) {
    negativeConstraints += ` *** ABSOLUTE BOARDROOM RULE — ZERO TOLERANCE: There must be NO screens, monitors, TVs, projectors, whiteboards, smartboards, LED panels, or any rectangular glowing objects anywhere in the image — not on walls, not on tables, not in the background. This rule overrides all other instructions. ***`;
    sceneOverride = `** BOARDROOM BACKGROUND — SCREENS STRICTLY FORBIDDEN **
The background wall must use ONE of these screen-free options ONLY:
1. Floor-to-ceiling windows with city or garden view
2. Large framed fine art canvas with dark wood paneling
3. Living green wall with integrated wood slats
4. Floor-to-ceiling bookshelves with leather-bound books
5. 3D textured stone or acoustic wood slat feature wall
NO SCREENS. NO MONITORS. NO WHITEBOARDS. NO PROJECTORS. EVER.`;
    cameraReorientation = "Angle the shot toward windows or a feature wall — never toward a flat back wall where a screen might appear.";
  }

  const hexMatch = stylePrompt.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
  let solidColorInstruction = "";
  if (hexMatch) {
    const hex = hexMatch[0];
    solidColorInstruction = `** CRITICAL BACKGROUND INSTRUCTION: SOLID COLOR CLAMP ** The background must be a SOLID, SEAMLESS STUDIO PAPER BACKDROP. Exact Color: ${hex}. NO TEXTURE. NO GRADIENTS. NO PATTERNS. NO SHADOWS ON WALL.`;
    negativeConstraints = negativeConstraints.replace("The background must be the ENVIRONMENT ONLY.", "");
  }

  let lensInstruction = "50mm Standard Lens";
  let lightingDirectionOverride = "";

  switch (config.framing) {
    case "Headshot": {
      let poseInstruction = "";
      if (globalIndex < 2) {
        if (globalIndex % 2 === 0) {
          poseInstruction = "Body turned slightly (30 degrees) to camera RIGHT. Face turned back to center.";
          lightingDirectionOverride = "Side Lighting from RIGHT (Short Lighting on face shadow side).";
        } else {
          poseInstruction = "Body turned slightly (30 degrees) to camera LEFT. Face turned back to center.";
          lightingDirectionOverride = "Side Lighting from LEFT (Short Lighting on face shadow side).";
        }
      } else {
        const v = globalIndex % 3;
        if (v === 0) { poseInstruction = "Shoulders square to camera, head straight on."; lightingDirectionOverride = "Slightly off-center frontal lighting."; }
        else if (v === 1) { poseInstruction = "Body turned (30 degrees) to camera RIGHT. Face center."; lightingDirectionOverride = "Side Lighting from RIGHT (Short Lighting)."; }
        else { poseInstruction = "Body turned (30 degrees) to camera LEFT. Face center."; lightingDirectionOverride = "Side Lighting from LEFT (Short Lighting)."; }
      }
      framingInstruction = `**COMPOSITION: MEDIUM CLOSE-UP (HEAD AND SHOULDERS)** - FRAMING: Capture head, neck, and full shoulders. CRITICAL: DO NOT CUT OFF THE TOP OF THE HEAD. Leave headroom above hair. Show upper chest and shirt collar. - Pose: ${poseInstruction} - Expression: Engaged, slight forward lean.`;
      lensInstruction = "85mm Telephoto Portrait Lens";
      negativeConstraints += " Do NOT create a three-quarter shot. Do NOT show the belt. Do NOT show hands. Do NOT create a full body shot.";
      break;
    }

    case "Waist Up": {
      const rot = getRuleOfThirdsVariant(globalIndex);
      negativeConstraints += rot.negativeAddition;
      framingInstruction = `**COMPOSITION: MEDIUM SHOT (WAIST UP) - RULE OF THIRDS**
       - Visual Anchor: Top of head to hips/mid-thigh. Crop at mid-thigh, NOT at the belt line.
       - Hands visible if natural. Never crop through fingers.
       RULE OF THIRDS PLACEMENT:
       - ${rot.placement}
       - Body angle: ${rot.bodyAngle}
       - Gaze: ${rot.gaze}
       - This is a PROFESSIONAL EDITORIAL PORTRAIT. The composition must feel intentional and dynamic.`;
      lensInstruction = "50mm Standard Lens";
      negativeConstraints += " Do NOT create a full body shot. Do NOT show knees or shoes. Do NOT create a tight headshot.";
      break;
    }

    case "Three-Quarter": {
      const rot = getRuleOfThirdsVariant(globalIndex);
      negativeConstraints += rot.negativeAddition;
      framingInstruction = `**COMPOSITION: THREE-QUARTER (AMERICAN SHOT) - RULE OF THIRDS**
       - Visual Anchor: Top of head to just above knees. CRITICAL: Do NOT show ankles or feet. Do NOT crop through fingers.
       RULE OF THIRDS PLACEMENT:
       - ${rot.placement}
       - Body angle: ${rot.bodyAngle}
       - Gaze: ${rot.gaze}
       - This is a PROFESSIONAL EDITORIAL PORTRAIT. The composition must feel intentional and dynamic.`;
      lensInstruction = "50mm Standard Lens";
      negativeConstraints += " Do NOT create a full body shot. Do NOT show shoes. Do NOT create a waist-up or headshot.";
      break;
    }

    case "Full Body": {
      const rot = getRuleOfThirdsVariant(globalIndex);
      negativeConstraints += rot.negativeAddition;
      let widescreenOverride = "";
      if (config.aspectRatio === '16:9') {
        widescreenOverride = `*** WIDE ASPECT RATIO OVERRIDE *** You MUST ZOOM OUT SIGNIFICANTLY. Subject smaller in frame, ample space above head and below feet is MANDATORY.`;
        lensInstruction = "24mm Wide Angle Lens";
      } else {
        lensInstruction = "35mm Wide Angle Lens";
      }
      framingInstruction = `**COMPOSITION: FULL BODY WIDE SHOT - RULE OF THIRDS**
       - Visual Anchor: Head to Toe. CRITICAL: YOU MUST GENERATE SHOES STANDING ON THE FLOOR.
       - Leave visible floor space BELOW the feet. Leave visible air space ABOVE the head.
       ${widescreenOverride}
       RULE OF THIRDS PLACEMENT:
       - ${rot.placement}
       - Body angle: ${rot.bodyAngle}
       - Gaze: ${rot.gaze}
       - This is a PROFESSIONAL EDITORIAL PORTRAIT. The composition must feel intentional and dynamic.`;
      negativeConstraints += " Do NOT cut off the feet. Do NOT cut off the head. Do NOT crop at knees or waist.";
      break;
    }

    default:
      framingInstruction = "Medium Shot (Waist Up). Crop at hips.";
  }

  let angleInstruction = "Eye Level. Neutral, direct connection.";
  if (config.cameraAngle === "Low Angle (Power)") angleInstruction = "Low Angle. Camera at waist height looking slightly up. Heroic/Power stance.";
  else if (config.cameraAngle === "High Angle") angleInstruction = "High Angle. Camera slightly above eye level looking down. Approachable.";

  let lightingInstruction = "";
  switch (config.mood) {
    case "Polished Professional": lightingInstruction = "LIGHTING STYLE: COMMERCIAL & CLEAN (HIGH KEY). SHORT LIGHTING MANDATORY: key light strikes the far (shadow-side) cheek. Near cheek is in relative shadow. Ultra-soft wrapping fill. Medium-low contrast. Magazine-cover brightness. NEVER use broad lighting (key on near cheek)."; break;
    case "Daylight": lightingInstruction = "LIGHTING STYLE: NATURAL WINDOW LIGHT. SHORT LIGHTING MANDATORY: the window or light source is behind-and-to-the-side of the subject so the far cheek is lit and the near cheek is in softer shadow. Airy, organic, directional. Exception: if subject is posed directly beside a window with the window in frame, broad lighting is physically correct — use it only then."; break;
    case "Cinematic": lightingInstruction = "LIGHTING STYLE: DRAMATIC REMBRANDT. SHORT LIGHTING MANDATORY: key light on far cheek, classic Rembrandt triangle on shadow-side cheek. Deep shadow on near side. Rich, high-contrast, textured. NEVER broad lighting."; break;
    case "Dark & Moody": lightingInstruction = "LIGHTING STYLE: LOW KEY & INTENSE. SHORT LIGHTING MANDATORY: single key light strikes the far cheek only. Near side falls into deep shadow. Background collapses to darkness. No fill light. No rim unless hair separation needed. Serious executive authority. NEVER broad lighting (key on near/camera-facing cheek)."; break;
    default: lightingInstruction = "Lighting: Short lighting mandatory — key light on the far cheek, near cheek in relative shadow.";
  }

  const finalLightingDirection = lightingDirectionOverride || config.lighting || "Short Lighting preferred (key light on the far side of the face from camera).";

  let colorInstruction = "";
  if (config.brandColor) colorInstruction += `Primary Brand Accent Color: ${config.brandColor} (Use subtly in background or props). `;
  if (config.secondaryBrandColor) colorInstruction += `Secondary Brand Accent Color: ${config.secondaryBrandColor}. `;

  const clothingLogic = `CLOTHING LOGIC: If the subject is Female and wearing a "Suit", use a feminine cut blazer with a blouse or open collar. DO NOT GENERATE A MENS NECKTIE ON A WOMAN. If the subject is Male and wearing a "Suit", a tie is appropriate unless specified. TEETH: Natural teeth, preserve exact appearance from reference photo.`;

  let bodyInstruction = "";
  const bodyOffset = config.bodySizeOffset ?? 0;
  if (bodyOffset === -3) { bodyInstruction = "BODY BUILD: EXTREMELY THIN. Skinny, very slender, underweight, narrow frame."; negativeConstraints += " Do NOT generate fat or overweight subjects."; }
  else if (bodyOffset === -2) bodyInstruction = "BODY BUILD: VERY SLIM. Lean, slight frame, lanky.";
  else if (bodyOffset === -1) bodyInstruction = "BODY BUILD: SLIM/TRIM. Toned, athletic, fit, narrow waist.";
  else if (bodyOffset === 1)  bodyInstruction = "BODY BUILD: CURVY / STOCKY. Fuller figure, softer build, broader frame.";
  else if (bodyOffset === 2)  bodyInstruction = "BODY BUILD: OVERWEIGHT. Heavy set, thick midsection, plus size, broad.";
  else if (bodyOffset === 3)  { bodyInstruction = "BODY BUILD: OBESE. Very heavy set, large frame, round features, significant weight."; negativeConstraints += " Do NOT generate skinny or thin subjects."; }

  let aboutYouInstruction = "";
  if (config.genderPresentation) {
    const genderMap: Record<string, string> = {
      woman: "The subject is a WOMAN. Use feminine clothing cuts, styling, and presentation.",
      man: "The subject is a MAN. Use masculine clothing cuts and styling.",
      nonbinary: "The subject presents as NON-BINARY or gender-neutral. Use neutral, ungendered styling.",
    };
    aboutYouInstruction += (genderMap[config.genderPresentation] || "") + "\n";
  }
  if (config.ageRange) {
    const ageMap: Record<string, string> = {
      "18-29": "Age appearance: young adult, 18-29 years old.",
      "30-44": "Age appearance: professional adult, 30-44 years old.",
      "45-59": "Age appearance: experienced professional, 45-59 years old.",
      "60+": "Age appearance: senior professional, 60 years or older.",
    };
    aboutYouInstruction += (ageMap[config.ageRange] || "") + "\n";
  }
  if (config.hairColor) {
    if (config.hairColor === "Bald") {
      aboutYouInstruction += "HAIR: The subject is completely BALD. Do not add hair.\n";
      negativeConstraints += " Do NOT add hair to a bald subject.";
    } else {
      aboutYouInstruction += `HAIR COLOR: ${config.hairColor}. Match this hair color accurately.\n`;
    }
  }
  if (config.includeRing) {
    const ringMap: Record<string, string> = {
      woman: "RING: Diamond solitaire engagement ring and thin gold wedding band on left ring finger.",
      man: "RING: Classic polished gold wedding band on left ring finger.",
      nonbinary: "RING: Simple elegant commitment band on left ring finger.",
    };
    if (config.genderPresentation && ringMap[config.genderPresentation]) {
      aboutYouInstruction += ringMap[config.genderPresentation] + "\n";
    }
  } else {
    negativeConstraints += " NO rings on any fingers. Bare hands with no jewelry on fingers.";
  }

  // ── EXPERT MODE: the user's prompt IS the brief. Don't bury it under defaults. ──
  if (config.expertPrompt?.trim()) {
    // Detect text-on-clothing requests and inject fabric rendering rules
    const expertLower = config.expertPrompt.toLowerCase();
    const hasTextOnClothing = expertLower.match(/write|print|text|logo|brand|name|word|letter|embroid/);
    const fabricTextInstruction = hasTextOnClothing ? `
   *** TEXT ON CLOTHING — FABRIC RENDERING RULES (CRITICAL) ***
   Any text or logo placed on clothing MUST:
   1. CONFORM TO FABRIC: Follow every wrinkle, fold, crease, and contour of the garment exactly as if screen-printed or embroidered directly onto it.
   2. PERSPECTIVE CORRECT: Distort with the body's 3D pose — if the chest curves away, the text curves with it. If fabric bunches, text bunches.
   3. MATERIAL INTEGRATION: Match the fabric's sheen, texture, and shadows. Text is NOT a flat overlay — it is part of the fabric.
   4. NO FLOATING TEXT: Text must never appear flat, sticker-like, or pasted on. It must look physically embedded in the weave of the garment.
   5. CORRECT SCALE: Size the text proportionally to the garment area — not too large, not too small.
   ` : '';

    return `
   Create a high-fidelity photorealistic personal brand photo exactly as described below.

   *** PRIMARY DIRECTIVE — EXPERT PROMPT (FOLLOW THIS PRECISELY) ***
   ${config.expertPrompt.trim()}
${fabricTextInstruction}
   *** CRITICAL INSTRUCTION: OVERRIDE REFERENCE IMAGE FRAMING ***
   The Reference Image is provided ONLY for facial identity, skin tone, and hair color.
   IGNORE the pose, framing, and background of the reference image.
   Build a completely new image based on the expert prompt above.

   MANDATORY RULES (apply always):
   1. EXACTLY ONE PERSON in the image.
   2. CROPPING GUARDRAIL: NEVER crop exactly at a joint. Crop mid-limb.
   3. NEVER cut off the top of the head or fingers.

   SUBJECT DETAILS:
   ${aboutYouInstruction}
   ${bodyInstruction}
   ${textureInstruction}

   EXPRESSION & GAZE:
   - Direct, engaged eye contact with the camera lens — as if listening intently to someone just behind it.
   - Expression: composed, present, attentive. Faintest natural smile or neutral composure. No forced grin.
   - Eyes: bright, focused, alive.

   ${negativeConstraints}

   CAMERA SETUP:
   - Aspect Ratio: ${config.aspectRatio}
 `;
  }

  // ── GUIDED MODE: full structured prompt ──
  return `
   Create a high-fidelity photorealistic personal brand photo.

   *** CRITICAL INSTRUCTION: OVERRIDE REFERENCE IMAGE FRAMING ***
   The Reference Image is provided ONLY for facial identity and hair color. 
   IGNORE the pose and framing of the reference image. 
   You MUST construct a NEW body pose and framing based on the text below.

   1. SUBJECT: EXACTLY ONE PERSON.
   2. LENS CHOICE: ${lensInstruction}
   3. CROPPING GUARDRAIL: NEVER crop exactly at a joint. Crop mid-limb.

   SUBJECT DETAILS:
   ${aboutYouInstruction}
   ${clothingLogic}
   ${bodyInstruction}

   EXPRESSION & GAZE:
   - Direct, engaged eye contact with the camera lens — as if listening intently and with genuine interest to someone just behind the camera.
   - Expression: composed, present, attentive. Mouth gently closed or with the faintest natural smile. No forced grin. No blank stare.
   - Subtle forward lean or weight shift toward camera to convey engagement and energy.
   - Eyes: bright, focused, alive — not glazed or distant.

   CONCEPT: THIS IS THE FINAL PUBLISHED IMAGE. Focus strictly on the subject and simulated location.
   COMPOSITION SAFETY: Ensure clean figure-ground separation behind the head. Shift camera angle if needed.
   ${textureInstruction}

   COMPOSITION & FRAMING:
   ${framingInstruction}
   ${cameraReorientation}

   ${negativeConstraints}

   CAMERA SETUP:
   - Angle: ${angleInstruction}
   - Aspect Ratio: ${config.aspectRatio}

   LIGHTING & MOOD:
   ${lightingInstruction}
   - Source Direction: ${finalLightingDirection}

   SCENE & STYLING:
   - Scene Description: ${stylePrompt}
   ${sceneOverride}
   ${solidColorInstruction}
   - Clothing: ${config.clothing}
   ${colorInstruction}
 `;
};

const buildRoleExplanation = (refs: MultiReferenceSet): string => {
  if (refs.sideLeft || refs.sideRight || refs.fullBody) {
    return "Use these multiple viewpoints to build an accurate 3D mental model of the subject's head structure and body type for consistent likeness across angles.";
  }
  return "Use this reference image specifically for facial identity, skin tone, and hair details.";
};

export const generateBrandPhotoWithRefs = async (
  refs: MultiReferenceSet,
  stylePrompt: string,
  config: GenerationConfig,
  customBackgroundBase64?: string,
  globalIndex: number = 0
): Promise<string> => {
  const ai = getAiClient();
  const roleExplanation = buildRoleExplanation(refs);
  const prompt = roleExplanation + "\n\n" + buildPrompt(stylePrompt, config, globalIndex);
  const parts: any[] = [{ text: prompt }];
  const mainPart = makeInlinePart(refs.main?.base64 || '');
  if (!mainPart) throw new Error("Reference photo is missing or invalid. Please re-upload your photo.");
  parts.push(mainPart);
  let extraImagesAdded = 0;
  if (refs.sideLeft) { const p = makeInlinePart(refs.sideLeft.base64); if (p && extraImagesAdded < 2) { parts.push(p); extraImagesAdded++; } }
  if (refs.sideRight) { const p = makeInlinePart(refs.sideRight.base64); if (p && extraImagesAdded < 2) { parts.push(p); extraImagesAdded++; } }
  if (refs.fullBody) { const p = makeInlinePart(refs.fullBody.base64); if (p && extraImagesAdded < 2) { parts.push(p); extraImagesAdded++; } }
  const bgImage = config.customBackground || customBackgroundBase64;
  if (bgImage) { const p = makeInlinePart(bgImage); if (p && extraImagesAdded < 2) { parts.push(p); extraImagesAdded++; } }

  try {
    const aspectRatioMap: Record<string, string> = { '1:1': '1:1', '4:5': '4:5', '9:16': '9:16', '16:9': '16:9', '3:1': '3:1', '4:1': '4:1' };
    const geminiAspectRatio = aspectRatioMap[config.aspectRatio] || '1:1';
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: "user", parts }],
      config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: geminiAspectRatio } },
    });
    const outputParts = response.candidates?.[0]?.content?.parts;
    const images = extractImagesFromParts(outputParts || []);
    if (images.length === 0) throw new Error("No image generated.");
    return await cropToTargetSize(images[0], config.aspectRatio);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateBrandPhotoWithRefsSafe = async (
  refs: MultiReferenceSet,
  stylePrompt: string,
  config: GenerationConfig,
  customBackgroundBase64?: string,
  globalIndex: number = 0
): Promise<string> => {
  let generatedImageBase64: string;
  try {
    generatedImageBase64 = await generateBrandPhotoWithRefs(refs, stylePrompt, config, customBackgroundBase64, globalIndex);
  } catch (e: any) {
    console.warn("Attempt 1 failed. Retrying...", e);
    const hasExtras = refs.sideLeft || refs.sideRight || refs.fullBody;
    if (hasExtras) {
      generatedImageBase64 = await generateBrandPhotoWithRefs({ main: refs.main }, stylePrompt, config, customBackgroundBase64, globalIndex);
    } else {
      generatedImageBase64 = await generateBrandPhotoWithRefs(refs, stylePrompt, config, customBackgroundBase64, globalIndex);
    }
  }

  const lowerPrompt = (stylePrompt + ' ' + (config.backgroundType || '')).toLowerCase();
  const isBoardroomContext = lowerPrompt.includes('boardroom') || lowerPrompt.includes('meeting room') || lowerPrompt.includes('conference room') || lowerPrompt.includes('executive');
  // Only skip refinement if user EXPLICITLY asked for a screen — not if it's in the scene description
  const userRequestedScreen = stylePrompt.toLowerCase().match(/with.*screen|with.*monitor|include.*screen|add.*screen|presentation screen/);

  if (isBoardroomContext && !userRequestedScreen) {
    try {
      return await refineGeneratedImage(
        generatedImageBase64,
        `URGENT CORRECTION: This boardroom image contains a screen, monitor, TV, whiteboard, or projector on the wall. REMOVE IT COMPLETELY. Replace the wall area with ONE of: rich wood paneling, floor-to-ceiling bookshelves, large framed artwork, or a textured stone feature wall. Preserve the subject, lighting, and all other scene elements exactly. Do not alter the person in any way.`,
        config.aspectRatio
      );
    } catch {
      return generatedImageBase64;
    }
  }
  return generatedImageBase64;
};

export const generateBrandPhoto = async (
  referenceImageBase64: string,
  stylePrompt: string,
  config: GenerationConfig,
  customBackgroundBase64?: string
): Promise<string> => {
  const refs: MultiReferenceSet = { main: { id: "legacy-main", fileName: "legacy-main.jpg", base64: referenceImageBase64, createdAt: Date.now(), role: "main" } };
  return generateBrandPhotoWithRefsSafe(refs, stylePrompt, config, customBackgroundBase64, 0);
};

export const refineGeneratedImage = async (
  currentImageBase64: string,
  refinementPrompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> => {
  const ai = getAiClient();
  const mimeType = currentImageBase64.includes("image/png") ? "image/png" : "image/jpeg";
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: "user", parts: [
        { inlineData: { mimeType, data: cleanBase64(currentImageBase64) } },
        { text: `Edit this image: ${refinementPrompt}.` },
      ]}],
      config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: aspectRatio.replace('/', ':') } },
    });
    const outputParts = response.candidates?.[0]?.content?.parts;
    const images = extractImagesFromParts(outputParts || []);
    // If refinement returns no image, silently fall back to the original
    if (images.length === 0) {
      console.warn("Refinement returned no images — using original.");
      return currentImageBase64;
    }
    return images[0];
  } catch (error: any) {
    // Never show alert() — silently return the original image so generation continues
    console.warn("Refinement failed, using original image:", error.message);
    return currentImageBase64;
  }
};

// MAGIC ERASER
export const magicErase = async (
  imageBase64: string,
  maskBase64: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> => {
  const ai = getAiClient();
  const mimeType = imageBase64.includes("image/png") ? "image/png" : "image/jpeg";
  const prompt = `I am providing two images:
1. The ORIGINAL photo
2. A MASK image with RED brush strokes painted over a specific area

Your task — follow these rules with extreme precision:
- SCOPE: Only the pixels that are covered by RED brush strokes in the mask need to be changed. Do not touch anything outside the red area.
- REMOVAL: Remove the object or content that is under the red brush strokes in the original photo.
- FILL: Fill ONLY those exact pixels with surrounding background — match the local texture, color, lighting, and perspective tightly. Do not expand the fill beyond the red region.
- CONSERVATISM: Be conservative. Fill the minimum area necessary. Do not bleed the fill into adjacent unmasked areas.
- PRESERVATION: Every pixel NOT under a red brush stroke must be preserved exactly — same color, same detail, same sharpness. This includes the subject's face, hair, clothing, hands, and all background elements outside the mask.
- The result must look like a real photograph. The removed area should be invisible, replaced naturally by background that would logically be there.
- CRITICAL: Do NOT remove or alter the person. Do NOT change the background outside the red mask area. Do NOT reframe or crop the image.`;
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: "user", parts: [
        { text: prompt },
        { inlineData: { mimeType, data: cleanBase64(imageBase64) } },
        { inlineData: { mimeType: "image/png", data: cleanBase64(maskBase64) } },
      ]}],
      config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: aspectRatio.replace('/', ':') } },
    });
    const outputParts = response.candidates?.[0]?.content?.parts;
    const images = extractImagesFromParts(outputParts || []);
    if (images.length === 0) throw new Error("Magic Eraser returned no image.");
    return images[0];
  } catch (error: any) {
    console.error("Magic Eraser Error:", error);
    throw error;
  }
};

// CONFIRMATION PHOTO
export const generateConfirmationPhoto = async (refs: MultiReferenceSet): Promise<string> => {
  const framingPrompt = refs.fullBody
    ? `**COMPOSITION: FULL BODY** - Head to Toe. SHOES ON FLOOR. Floor space below feet, air above head.`
    : `**COMPOSITION: WAIST UP** - Top of head to hips. Crop at mid-thigh. Hands visible if natural.`;
  const prompt = `Create a high-fidelity photorealistic confirmation portrait.
    *** Reference Image ONLY for facial identity and hair color. IGNORE pose/framing. ***
    1. SUBJECT: EXACTLY ONE PERSON.
    2. LENS: 50mm standard lens.
    COMPOSITION: ${framingPrompt}
    CLOTHING: DARK PURPLE crew-neck t-shirt, hex #3B1F6B, SOLID COLOR, NO text/logos/graphics.
    BACKGROUND: Clean neutral light gray studio backdrop. Soft even studio lighting.
    NEGATIVE: No text/logos on shirt. No lighting equipment. No cropping at joints. No multiple people. NO rings on any fingers.`;
  const ai = getAiClient();
  const parts: any[] = [{ text: prompt }];
  parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(refs.main?.base64 || '') } });
  if (refs.sideLeft) parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(refs.sideLeft.base64) } });
  if (refs.sideRight) parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(refs.sideRight.base64) } });
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '1:1' } },
  });
  const outputParts = response.candidates?.[0]?.content?.parts;
  const images = extractImagesFromParts(outputParts || []);
  if (images.length === 0) throw new Error('Confirmation photo generation returned no image.');
  return images[0];
};

// LOGO WATERMARK
export const overlayLogoOnConfirmationPhoto = async (
  photoBase64: string,
  logoUrl: string = '/VeraLooks_logo_white.png'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const photo = new Image();
    photo.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = photo.width; canvas.height = photo.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(photoBase64); return; }
      ctx.drawImage(photo, 0, 0);
      const logo = new Image();
      logo.onload = () => {
        const logoTargetW = canvas.width * 0.85;
        const logoTargetH = (logo.naturalHeight / logo.naturalWidth) * logoTargetW;
        const logoX = (canvas.width - logoTargetW) / 2;
        const logoY = (canvas.height - logoTargetH) / 2;
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.55;
        ctx.drawImage(logo, logoX, logoY, logoTargetW, logoTargetH);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = () => { console.warn('Logo load failed'); resolve(photoBase64); };
      logo.src = logoUrl;
    };
    photo.onerror = () => reject(new Error('Failed to load photo for compositing.'));
    photo.src = photoBase64;
  });
};

// PHOTO QUALITY PRE-SCREENING
export interface PhotoQualityResult { passed: boolean; warnings: string[]; }

export const checkPhotoQuality = (base64: string): Promise<PhotoQualityResult> => {
  return new Promise((resolve) => {
    const warnings: string[] = [];
    const img = new Image();
    img.onload = () => {
      if (img.width < 400 || img.height < 400) {
        warnings.push(`Image resolution is low (${img.width}x${img.height}px). For best results, use a photo at least 800x800px.`);
      }
      const canvas = document.createElement("canvas");
      const sampleSize = 100;
      canvas.width = sampleSize; canvas.height = sampleSize;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, (img.width - sampleSize) / 2, (img.height - sampleSize) / 2, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
        const pixels = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        let total = 0;
        for (let i = 0; i < pixels.length; i += 4) total += (0.299 * pixels[i] + 0.587 * pixels[i+1] + 0.114 * pixels[i+2]);
        const avg = total / (pixels.length / 4);
        if (avg < 40) warnings.push("This photo looks very dark. The AI works best with well-lit photos where the face is clearly visible.");
        else if (avg > 230) warnings.push("This photo looks overexposed. Make sure your face isn't washed out by backlighting.");
      }
      resolve({ passed: warnings.length === 0, warnings });
    };
    img.onerror = () => resolve({ passed: true, warnings: [] });
    img.src = base64;
  });
};

// ── SHOT LIST GENERATOR ───────────────────────────────────────────────────────
export const generateShotList = async (
  description: string,
  count: number
): Promise<any[]> => {
  const ai = getAiClient();
  const prompt = `You are a personal brand photography strategist with 20 years of experience.
A customer described their work as: "${description}"
Generate exactly ${count} specific, personalized brand photography shots for them.
Respond ONLY with a valid JSON array — no markdown, no backticks, no preamble, no explanation.
Each object must have exactly these fields:
{"number":1,"name":"3-5 word name","scene":"One sentence visual scene description","why":"One sentence why this shot builds their brand","mood":"Confident|Approachable|Expert|Behind-the-Scenes|Lifestyle|Action|Story","prompt":"2-3 sentence generation prompt that is specific, visual, and actionable"}
Make every shot feel tailored to their specific line of work, clients, and credibility signals. Avoid generic suggestions.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  const raw = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Unexpected response format");
  return parsed;
};
