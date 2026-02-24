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

// ✅ UPDATED: gemini-2.5-flash-image is the current stable model (Aug 2025)
const IMAGE_MODEL = "gemini-2.5-flash-image";

const cleanBase64 = (dataUrl: string) => {
  if (!dataUrl) return "";
  const parts = dataUrl.split(",");
  return parts.length === 2 ? parts[1] : dataUrl;
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
      if (!ctx) {
        resolve(base64Image);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const scale = Math.max(
        canvas.width / img.width,
        canvas.height / img.height
      );
      const x = canvas.width / 2 - (img.width / 2) * scale;
      const y = canvas.height / 2 - (img.height / 2) * scale;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      console.error("Image load failed for cropping");
      resolve(base64Image);
    };
    img.src = base64Image;
  });
};

// --- PHOTOGRAPHER LOGIC: BUILD PROMPT ---
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
   - NO GLASSES unless the reference image clearly shows the subject wearing glasses.
   - CLOTHING TEXT: No text, no logos, no lettering, no graphics on any garment.
   - (Exception: If the scene description specifically asks for a "photo studio set" with visible gear, ignore the lighting equipment constraint).
 `;

  let textureInstruction = "";

  if (config.retouchLevel === 'None') {
    textureInstruction = `
      ** CRITICAL TEXTURE & REALISM INSTRUCTION (NO RETOUCHING) **
      - CAPTURE AUTHENTIC SKIN TEXTURE: Visible natural pores, fine lines, vellus hair (peach fuzz), and subtle skin variation.
      - HIGH-FREQUENCY DETAIL: Preserve micro-contrast and organic tonal variation across the face.
      - OPTICAL REALISM: Skin must appear naturally imperfect, realistic, and optically true, as photographed with a professional full-frame camera and 85mm portrait lens.
      - NO SMOOTHING: Absolutely NO beauty filters, NO plastic skin, NO airbrushed effect, NO blurred pores.
      - LIGHTING INTERACTION: Show realistic specular highlights on skin texture, not just flat color.
      ** CRITICAL: RAW SENSOR DATA LOOK (ZERO RETOUCHING) **
      - TEXTURE PRIORITY: You MUST render deep, sharp high-frequency skin details (pores, micro-wrinkles, uneven skin tone).
      - IMPERFECTIONS: Do not hide age lines, sun spots, or texture. The skin must look "uncomfortably real".
      - SENSOR NOISE: Allow subtle luminance noise to prevent the "plastic AI look".
      - SUBSURFACE SCATTERING: Ensure light penetrates the skin surface to create fleshy, organic translucency.
      - PROHIBITED: Do not apply any "glamour glow" or "soft skin" filters.
      - REFERENCE: Think "Phase One 100MP Raw File" zoomed in 100%.
   `;
    negativeConstraints += `
      - plastic skin, waxy skin, airbrushed face, beauty filter, over-smoothed skin, blurred pores, CGI skin, hyper-perfect complexion, synthetic texture.
      - beauty filter, smoothing, airbrush, wax, plastic, blurred pores, foundation, perfect skin, doll-like, denoised, soft glow.
   `;
  } else if (config.retouchLevel === 'Natural') {
    textureInstruction = "Skin should look healthy and clean but maintain natural texture. Slight retouching allowed but keep it realistic.";
  } else if (config.retouchLevel === 'Polished') {
    textureInstruction = "Commercial polished look. Smooth skin tone, reduced blemishes, but keep essential facial features intact.";
  } else if (config.retouchLevel === 'Airbrushed') {
    textureInstruction = "High-fashion magazine retouching. Very smooth, flawless complexion, perfected features.";
  }

  // --- BOARDROOM MONITOR ERADICATION ---
  const lowerPrompt = (stylePrompt + (config.backgroundType || '')).toLowerCase();
  const isBoardroomContext = lowerPrompt.includes('boardroom') || lowerPrompt.includes('meeting room') || lowerPrompt.includes('conference room');
  const userRequestedScreen = lowerPrompt.match(/screen|monitor|tv|projector|display|presentation|slide/);

  let sceneOverride = "";
  let cameraReorientation = "";

  if (isBoardroomContext && !userRequestedScreen) {
    negativeConstraints += `
     CRITICAL BACKGROUND RULE: NO RECTANGULAR OBJECTS ON WALLS.
     - ABSOLUTELY NO televisions, computer monitors, projector screens (pull-down or fixed), whiteboards, smartboards, or LED walls.
     - Do not render black, white, or gray rectangles on the wall.
     - Do not render any framed rectangles that look like screens.
   `;
    sceneOverride = `
     ** BACKGROUND OVERRIDE FOR BOARDROOM (NO SCREENS) **
     - The background must be architecturally dense and analog.
     - CHOOSE ONE replacement for the background wall: 
       1. A large, framed abstract canvas art piece flanked by tall potted fiddle-leaf fig plants.
       2. A "Green Wall" (living plants) integrated with dark wood paneling.
       3. 3D textured acoustic wood slats (vertical lines) covering the entire wall.
       4. Floor-to-ceiling bookshelves filled with books and curated artifacts.
   `;
    cameraReorientation = "Compose the shot angled slightly into the room depth or towards windows, avoiding flat back walls.";
  }

  // --- SOLID COLOR CLAMPING ---
  const hexMatch = stylePrompt.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
  let solidColorInstruction = "";

  if (hexMatch) {
    const hex = hexMatch[0];
    solidColorInstruction = `
     ** CRITICAL BACKGROUND INSTRUCTION: SOLID COLOR CLAMP **
     - The background must be a SOLID, SEAMLESS STUDIO PAPER BACKDROP.
     - Exact Color: ${hex}
     - NO TEXTURE. NO GRADIENTS. NO PATTERNS. NO SHADOWS ON WALL.
     - The background lighting must be FLAT and UNIFORM to ensure the color hex code matches exactly.
     - Do not simulate a room; simulate a photography studio with a paper roll.
   `;
    negativeConstraints = negativeConstraints.replace("The background must be the ENVIRONMENT ONLY.", "");
  }

  let lensInstruction = "50mm Standard Lens";
  let lightingDirectionOverride = "";

  switch (config.framing) {
    case "Headshot": {
      let poseInstruction = "";
      if (globalIndex < 2) {
        if (globalIndex % 2 === 0) {
          poseInstruction = "Standard Portrait Pose: Body turned slightly (approx 30 degrees) to camera RIGHT. One shoulder closer to lens. Face turned back to center.";
          lightingDirectionOverride = "Side Lighting from RIGHT (creating flattering Short Lighting on face shadow side).";
        } else {
          poseInstruction = "Standard Portrait Pose: Body turned slightly (approx 30 degrees) to camera LEFT. One shoulder closer to lens. Face turned back to center.";
          lightingDirectionOverride = "Side Lighting from LEFT (creating flattering Short Lighting on face shadow side).";
        }
      } else {
        const varietyMod = globalIndex % 3;
        if (varietyMod === 0) {
          poseInstruction = "Shoulders square to camera, head straight on. Direct, confident connection.";
          lightingDirectionOverride = "Slightly off-center frontal lighting.";
        } else if (varietyMod === 1) {
          poseInstruction = "Body turned slightly (30 degrees) to camera RIGHT. Face center.";
          lightingDirectionOverride = "Side Lighting from RIGHT (Short Lighting).";
        } else {
          poseInstruction = "Body turned slightly (30 degrees) to camera LEFT. Face center.";
          lightingDirectionOverride = "Side Lighting from LEFT (Short Lighting).";
        }
      }

    framingInstruction = `
       **COMPOSITION: MEDIUM CLOSE-UP (HEAD AND SHOULDERS)**
       - FRAMING: Capture head, neck, and full shoulders.
       - CRITICAL: DO NOT CUT OFF THE TOP OF THE HEAD.
       - Leave "headroom" (empty space) above the hair.
       - Show upper chest and shirt collar.
       - Visual Anchor: Mid-Chest to slightly above top of head.
       - Pose: ${poseInstruction}
       - Expression: "Listening carefully", engaged, slight forward lean.
     `;
      lensInstruction = "85mm Telephoto Portrait Lens (Compresses background, flattering for faces)";
      negativeConstraints += "Do NOT create a three-quarter shot. Do NOT show the belt. Do NOT show hands. Do NOT create a full body shot.";
      break;
    }

    case "Waist Up":
      framingInstruction = `
       **COMPOSITION: MEDIUM SHOT (WAIST UP)**
       - Visual Anchor: Top of head to hips.
       - Crop Limit: CUT FRAME AT MID-THIGH or HIPS.
       - CRITICAL: Do NOT crop exactly at the belt line. Go slightly lower (mid-thigh).
       - Hands: Hands should be visible if natural. Never crop through the fingers.
     `;
      lensInstruction = "50mm Standard Lens";
      negativeConstraints += "Do NOT create a full body shot. Do NOT show knees or shoes. Do NOT create a tight headshot. Do NOT crop through fingers or hands.";
      break;

    case "Three-Quarter":
      framingInstruction = `
       **COMPOSITION: THREE-QUARTER (AMERICAN SHOT)**
       - Visual Anchor: Top of head to knees.
       - Crop Limit: CUT FRAME JUST ABOVE THE KNEES.
       - CRITICAL: Do NOT show ankles or feet. Do NOT crop through fingers.
     `;
      lensInstruction = "50mm Standard Lens";
      negativeConstraints += "Do NOT create a full body shot. Do NOT show shoes. Do NOT create a waist-up or headshot. Do NOT crop through fingers or hands.";
      break;

    case "Full Body":
      framingInstruction = `
       **COMPOSITION: FULL BODY WIDE SHOT**
       - Visual Anchor: Head to Toe.
       - CRITICAL REQUIREMENT: YOU MUST GENERATE SHOES STANDING ON THE FLOOR.
       - Leave visible floor space BELOW the feet.
       - Leave visible air space ABOVE the head.
       - All fingers must be fully within the frame if hands are visible.
     `;

      if (config.aspectRatio === '16:9') {
        framingInstruction += `
        \n\n*** WIDE ASPECT RATIO OVERRIDE ***
        - Since the frame is wide (16:9) and short, you MUST ZOOM OUT SIGNIFICANTLY.
        - The subject should be smaller in the frame to ensure their head and feet fit comfortably within the shallow vertical space.
        - Create a wide environmental portrait. Ample space above head and below feet is MANDATORY.
        `;
        lensInstruction = "24mm Wide Angle Lens (Environmental portrait, subject smaller in frame)";
      } else {
        lensInstruction = "35mm Wide Angle Lens (To capture full subject and environment)";
      }

      negativeConstraints += "Do NOT cut off the feet. Do NOT cut off the head. Do NOT crop at knees or waist. Do NOT crop through fingers or toes.";
      break;

    default:
      framingInstruction = "Medium Shot (Waist Up). Crop at hips.";
  }

  let angleInstruction = config.cameraAngle || "Eye Level";
  if (angleInstruction === "Low Angle (Power)") {
    angleInstruction = "Low Angle. Camera at waist height looking slightly up. Heroic/Power stance.";
  } else if (angleInstruction === "High Angle") {
    angleInstruction = "High Angle. Camera slightly above eye level looking down. Approachable.";
  } else {
    angleInstruction = "Eye Level. Neutral, direct connection.";
  }

  let lightingInstruction = "";
  switch (config.mood) {
    case "Polished Professional":
      lightingInstruction = `
       LIGHTING STYLE: COMMERCIAL & CLEAN (HIGH KEY)
       - Light Quality: Ultra-soft, wrapping illumination. Flattering and smooth.
       - Contrast: Medium-Low. Bright and optimistic atmosphere.
       - Shadows: Very subtle, open, and lifted. No harsh dark areas on the face.
       - Effect: "Magazine Cover" quality brightness.
       - IMPORTANT: The light source is invisible and off-camera.
       - Short Lighting preferred: key light should favor the far cheek.
     `;
      break;
    case "Daylight":
      lightingInstruction = `
       LIGHTING STYLE: NATURAL WINDOW AMBIANCE
       - Light Quality: Organic, directional daylight coming from the side.
       - Atmosphere: Airy, diffused, and real.
       - Highlights: Natural sheen on skin.
       - Shadows: Cool-toned and open.
       - Effect: As if standing next to a large North-facing window.
       - Short Lighting preferred where possible. If scene implies diffused/overcast light (cloudy sky, north window), even illumination is acceptable.
     `;
      break;
    case "Cinematic":
      lightingInstruction = `
       LIGHTING STYLE: DRAMATIC & TEXTURED
       - Light Quality: High contrast "Rembrandt" style.
       - Pattern: Distinct triangle of light on the shadow-side cheek.
       - Atmosphere: Rich, moody, and serious.
       - Color: Warmer practical lights in background vs cooler foreground light.
       - Short Lighting: ensure the Rembrandt triangle is on the shadow-side cheek (far from camera).
     `;
      break;
    case "Dark & Moody":
      lightingInstruction = `
       LIGHTING STYLE: LOW KEY & INTENSE
       - Light Quality: Minimalist lighting. Subject emerges from shadow.
       - Background: Falls off into deep darkness/black.
       - Focus: Highlighting only the face and hands.
       - Vibe: Serious, executive authority, powerful.
       - Short Lighting: key light from the far side only. Near side of face falls into shadow.
     `;
      break;
    default:
      lightingInstruction = "Lighting: Soft professional lighting with short lighting preferred.";
  }

  const shortLightingDefault = `Short Lighting preferred (key light on the far side of the face from camera, shadow falls toward camera). Use this as the default unless the scene logically implies a different source.`;
  const finalLightingDirection = lightingDirectionOverride || config.lighting || shortLightingDefault;

  let colorInstruction = "";
  if (config.brandColor) {
    colorInstruction += `Primary Brand Accent Color: ${config.brandColor} (Use subtly in background or props). `;
  }
  if (config.secondaryBrandColor) {
    colorInstruction += `Secondary Brand Accent Color: ${config.secondaryBrandColor}. `;
  }

  const clothingLogic = `
   CLOTHING LOGIC:
   - If the subject is Female and wearing a "Suit", use a feminine cut blazer with a blouse or open collar. DO NOT GENERATE A MENS NECKTIE ON A WOMAN.
   - If the subject is Male and wearing a "Suit", a tie is appropriate unless specified otherwise.
   - TEETH: Natural teeth — preserve the exact appearance from the reference photo. Do not over-whiten or straighten beyond what is visible in the reference.
 `;

  let bodyInstruction = "";
  const bodyOffset = config.bodySizeOffset ?? 0;

  if (bodyOffset !== 0) {
    if (bodyOffset === -3) {
      bodyInstruction = "BODY BUILD: EXTREMELY THIN. Skinny, very slender, underweight appearance. Narrow frame.";
      negativeConstraints += "Do NOT generate fat or overweight subjects. ";
    }
    if (bodyOffset === -2) bodyInstruction = "BODY BUILD: VERY SLIM. Lean, slight frame, lanky.";
    if (bodyOffset === -1) bodyInstruction = "BODY BUILD: SLIM/TRIM. Toned, athletic, fit, narrow waist.";
    if (bodyOffset === 1)  bodyInstruction = "BODY BUILD: CURVY / STOCKY. Fuller figure, softer build, broader frame.";
    if (bodyOffset === 2)  bodyInstruction = "BODY BUILD: OVERWEIGHT. Heavy set, thick midsection, plus size, broad.";
    if (bodyOffset === 3) {
      bodyInstruction = "BODY BUILD: OBESE. Very heavy set, large frame, round features, significant weight.";
      negativeConstraints += "Do NOT generate skinny or thin subjects. ";
    }
  }

  const fourthWallLogic = `
   CONCEPT: THIS IS THE FINAL PUBLISHED IMAGE.
   - This is NOT a behind-the-scenes shot.
   - The camera frame MUST NOT reveal the production environment.
   - Focus strictly on the subject and the simulated location.
 `;

  const mergerLogic = `
   COMPOSITION SAFETY:
   - Ensure clean figure-ground separation behind the head.
   - SHIFT THE CAMERA ANGLE if necessary to avoid poles, frames, or lines intersecting the head.
 `;

  return `
   Create a high-fidelity photorealistic personal brand photo.

   *** CRITICAL INSTRUCTION: OVERRIDE REFERENCE IMAGE FRAMING ***
   The Reference Image is provided ONLY for facial identity and hair color. 
   IGNORE the pose and framing of the reference image. 
   You MUST construct a NEW body pose and framing based on the text below.

   1. SUBJECT: EXACTLY ONE PERSON.
   2. LENS CHOICE: ${lensInstruction}
   3. CROPPING GUARDRAIL: NEVER crop exactly at a joint (knees, elbows, waist). Crop mid-limb.

   ${clothingLogic}
   ${bodyInstruction}
   ${fourthWallLogic}
   ${mergerLogic}
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

  // Main reference image
  parts.push({
    inlineData: {
      mimeType: "image/jpeg",
      data: cleanBase64(refs.main?.base64 || ''),
    },
  });

  // Extra reference images (max 2 additional)
  let extraImagesAdded = 0;

  if (refs.sideLeft && extraImagesAdded < 2) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(refs.sideLeft.base64) } });
    extraImagesAdded++;
  }

  if (refs.sideRight && extraImagesAdded < 2) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(refs.sideRight.base64) } });
    extraImagesAdded++;
  }

  if (refs.fullBody && extraImagesAdded < 2) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(refs.fullBody.base64) } });
    extraImagesAdded++;
  }

  const bgImage = config.customBackground || customBackgroundBase64;
  if (bgImage && extraImagesAdded < 2) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(bgImage) } });
  }

  try {
    console.log(`Calling ${IMAGE_MODEL} with ${parts.length - 1} images (Global Index ${globalIndex})...`);

 // Map app aspect ratios to Gemini imageConfig format
    const aspectRatioMap: Record<string, string> = {
      '1:1':  '1:1',
      '4:5':  '4:5',
      '9:16': '9:16',
      '16:9': '16:9',
      '3:1':  '3:1',
      '4:1':  '4:1',
    };
    const geminiAspectRatio = aspectRatioMap[config.aspectRatio] || '1:1';

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: geminiAspectRatio,
        },
      },
    });

    const outputParts = response.candidates?.[0]?.content?.parts;
    const images = extractImagesFromParts(outputParts || []);

    if (images.length === 0) {
      console.error("Full API Response:", JSON.stringify(response, null, 2));
      throw new Error("No image generated. The model may have refused the request — check console for details.");
    }

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
    console.warn("Attempt 1 failed. Retrying with simplified inputs...", e);
    const hasExtras = refs.sideLeft || refs.sideRight || refs.fullBody;
    if (hasExtras) {
      const simpleRefs: MultiReferenceSet = { main: refs.main };
      console.log("Fallback: Retrying with MAIN reference image only.");
      generatedImageBase64 = await generateBrandPhotoWithRefs(simpleRefs, stylePrompt, config, customBackgroundBase64, globalIndex);
    } else {
      generatedImageBase64 = await generateBrandPhotoWithRefs(refs, stylePrompt, config, customBackgroundBase64, globalIndex);
    }
  }

  // Auto-refinement for boardroom scenes (remove screens)
  const lowerPrompt = (stylePrompt + (config.backgroundType || '')).toLowerCase();
  const isBoardroomContext = lowerPrompt.includes('boardroom') || lowerPrompt.includes('meeting room') || lowerPrompt.includes('conference room');
  const userRequestedScreen = lowerPrompt.match(/screen|monitor|tv|projector|display|presentation|slide/);

  if (isBoardroomContext && !userRequestedScreen) {
    console.log("Boardroom detected — initiating auto-refinement to clean background...");
    try {
      const refinedImage = await refineGeneratedImage(
        generatedImageBase64,
        "Based on this image, remove any digital screens, monitors, TVs, whiteboards, or projector screens from the background walls. Replace them with continuous architectural wall material like wood paneling, textured stone, or glass, matching the existing scene. Ensure no glowing or blank rectangles remain on the walls. Add a large potted plant or framed abstract art if the wall feels too empty.",
        config.aspectRatio
      );
      return refinedImage;
    } catch (refinementError) {
      console.error("Auto-refinement failed, returning initial generation:", refinementError);
      return generatedImageBase64;
    }
  }

  return generatedImageBase64;
};

// Legacy single-image entry point
export const generateBrandPhoto = async (
  referenceImageBase64: string,
  stylePrompt: string,
  config: GenerationConfig,
  customBackgroundBase64?: string
): Promise<string> => {
  const refs: MultiReferenceSet = {
    main: {
      id: "legacy-main",
      fileName: "legacy-main.jpg",
      base64: referenceImageBase64,
      createdAt: Date.now(),
      role: "main",
    },
  };
  return generateBrandPhotoWithRefsSafe(refs, stylePrompt, config, customBackgroundBase64, 0);
};

export const refineGeneratedImage = async (
  currentImageBase64: string,
  refinementPrompt: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> => {
  const ai = getAiClient();

  let mimeType = "image/jpeg";
  if (currentImageBase64.includes("image/png")) mimeType = "image/png";

  try {
    console.log(`Refining with ${IMAGE_MODEL}...`);
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: cleanBase64(currentImageBase64) } },
            { text: `Edit this image: ${refinementPrompt}.` },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: aspectRatio.replace('/', ':'),
        },
      },
    });
    
    const outputParts = response.candidates?.[0]?.content?.parts;
    const images = extractImagesFromParts(outputParts || []);

    if (images.length === 0) {
      throw new Error("Refinement returned no images.");
    }

    return images[0];
  } catch (error: any) {
    console.error("Refinement Error:", error);
    if (!refinementPrompt.includes("remove any digital screens")) {
      alert(`Refinement Failed: ${error.message}`);
    }
    throw error;
  }
};

// ============================================================
// ADD THIS FUNCTION to the bottom of geminiService.ts
// (before the final closing of the file)
// ============================================================

export const generateConfirmationPhoto = async (
  refs: MultiReferenceSet
): Promise<string> => {

  const framing = refs.fullBody ? 'Full Body' : 'Waist Up';
  const framingPrompt = refs.fullBody
    ? `**COMPOSITION: FULL BODY WIDE SHOT**
       - Visual Anchor: Head to Toe.
       - CRITICAL: YOU MUST GENERATE SHOES STANDING ON THE FLOOR.
       - Leave visible floor space BELOW the feet.
       - Leave visible air space ABOVE the head.`
    : `**COMPOSITION: MEDIUM SHOT (WAIST UP)**
       - Visual Anchor: Top of head to hips.
       - Crop Limit: CUT FRAME AT MID-THIGH or HIPS.
       - CRITICAL: Do NOT crop exactly at the belt line. Go slightly lower.
       - Hands should be visible if natural. Never crop through fingers.`;

  const prompt = `
    Create a high-fidelity photorealistic confirmation portrait photo.

    *** CRITICAL INSTRUCTION: OVERRIDE REFERENCE IMAGE FRAMING ***
    The Reference Image is provided ONLY for facial identity and hair color.
    IGNORE the pose and framing of the reference image.
    Construct a NEW body and pose based on the instructions below.

    1. SUBJECT: EXACTLY ONE PERSON. No clones. No group photos.
    2. LENS: 50mm standard lens.

    COMPOSITION & FRAMING:
    ${framingPrompt}

    CLOTHING (CRITICAL):
    - The subject MUST wear a DARK PURPLE crew-neck t-shirt.
    - Hex color of shirt: #3B1F6B
    - The shirt must be SOLID COLOR with NO text, NO logos, NO graphics, NO patterns.
    - Keep it clean — we will overlay the logo separately.

    BACKGROUND:
    - Clean, neutral light gray studio backdrop.
    - Soft, even studio lighting. No harsh shadows.
    - Professional headshot studio feel.

    LIGHTING:
    - Soft, wrapping studio light. Flattering and clean.
    - Short lighting preferred: key light on the far cheek.
    - No visible lighting equipment.

    NEGATIVE PROMPT:
    - Do NOT put any text, logos, or graphics on the shirt.
    - Do NOT show lighting equipment.
    - Do NOT crop at joints.
    - Do NOT generate multiple people.
    - NO glasses unless reference photo clearly shows them.
  `;

  const ai = getAiClient();

  const parts: any[] = [{ text: prompt }];

  parts.push({
    inlineData: {
      mimeType: 'image/jpeg',
      data: cleanBase64(refs.main?.base64 || ''),
    },
  });

  if (refs.sideLeft) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64(refs.sideLeft.base64),
      },
    });
  }

  if (refs.sideRight) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64(refs.sideRight.base64),
      },
    });
  }

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
    },
  });

  const outputParts = response.candidates?.[0]?.content?.parts;
  const images = extractImagesFromParts(outputParts || []);

  if (images.length === 0) {
    throw new Error('Confirmation photo generation returned no image.');
  }

  return images[0];
};


// ============================================================
// ADD THIS FUNCTION below generateConfirmationPhoto
// Composites the white VeraLooks logo onto the generated shirt
// ============================================================

// ============================================================
// REPLACE the existing overlayLogoOnConfirmationPhoto function
// in geminiService.ts with this version.
// ============================================================

export const overlayLogoOnConfirmationPhoto = async (
  photoBase64: string,
  logoUrl: string = '/VeraLooks_logo_white.png'
): Promise<string> => {
  return new Promise((resolve, reject) => {

    const photo = new Image();
    photo.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = photo.width;
      canvas.height = photo.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(photoBase64); return; }

      // Draw the base photo
      ctx.drawImage(photo, 0, 0);

      const logo = new Image();
      logo.onload = () => {
        // Large watermark: 85% of the canvas width
        const logoTargetW = canvas.width * 0.85;
        const logoTargetH = (logo.naturalHeight / logo.naturalWidth) * logoTargetW;

        // Centered horizontally and vertically
        const logoX = (canvas.width - logoTargetW) / 2;
        const logoY = (canvas.height - logoTargetH) / 2;

        // Semi-transparent white watermark — obvious and intentional
        // 'screen' blend mode knocks out any residual dark background
        // pixels from the PNG, leaving only the white lettering
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.55;
        ctx.drawImage(logo, logoX, logoY, logoTargetW, logoTargetH);

        // Reset
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = () => {
        // If logo fails to load just return the plain photo
        console.warn('Logo watermark failed to load — returning photo without overlay.');
        resolve(photoBase64);
      };
      logo.src = logoUrl;
    };

    photo.onerror = () => reject(new Error('Failed to load confirmation photo for compositing.'));
    photo.src = photoBase64;
  });
};
