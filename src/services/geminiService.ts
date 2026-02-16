import { GenerationConfig, AspectRatio, MultiReferenceSet } from "../types.ts";

export const generateBrandPhotoWithRefs = async (
  refs: MultiReferenceSet,
  stylePrompt: string,
  config: GenerationConfig,
  globalIndex: number = 0
): Promise<string> => {
  
  const headshotPrompt = `
    A high-end professional headshot of the person in the reference image.
    STYLE: Peter Hurley cinematic lighting, square jawline emphasis, sharp eyes.
    LIGHTING: ${config.mood}, soft-box wrap-around light.
    SCENE: ${stylePrompt}.
    TECHNICAL: 85mm lens, f/2.8, hyper-realistic skin texture.
  `;

  try {
    // This now calls your PRIVATE tunnel in the /api folder
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: headshotPrompt,
        image: refs.main?.base64,
        aspect_ratio: config.aspectRatio.replace(":", "/")
      }),
    });

    const result = await response.json();

    if (result.output && result.output.length > 0) {
      return result.output[0];
    } else {
      throw new Error("AI failed to generate. Check Vercel Logs.");
    }
  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};

export const generateBrandPhotoWithRefsSafe = generateBrandPhotoWithRefs;
export const generateBrandPhoto = generateBrandPhotoWithRefs;