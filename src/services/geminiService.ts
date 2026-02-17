import { GenerationConfig, AspectRatio, MultiReferenceSet } from "../types.ts";

export const generateBrandPhotoWithRefs = async (
  refs: MultiReferenceSet,
  stylePrompt: string,
  config: GenerationConfig,
  globalIndex: number = 0
): Promise<string> => {
  
const headshotPrompt = `
    A high-end professional commercial headshot. 
    SUBJECT: A detailed, hyper-realistic portrait of the person in the reference image. 
    LIGHTING: Peter Hurley's signature "Triangle" clamshell lighting setup. Bright, clean, even studio light using wrap-around strip boxes. Crisp catchlights in the eyes. No harsh shadows on the face.
    STYLE: Professional photography, sharp focus, 8k resolution.
    TECHNICAL: Shot on Hasselblad X2D, 85mm f/2.8 lens. Visible skin pores and fine textures. High-fidelity skin tones. 
    BACKGROUND: Clean, high-key white seamless studio background.
    MOOD: Confident, approachable, and professional.
  `;

try {
    // 1. START the job
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: headshotPrompt,
        image: refs.main?.base64,
        aspect_ratio: config.aspectRatio.replace(":", "/")
      }),
    });

    if (!response.ok) throw new Error("Failed to start AI engine");
    let prediction = await response.json();

    // 2. THE POLLING LOOP: Keep checking every 2 seconds
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      console.log("VeraLooks Engine Status:", prediction.status);
      
      // Wait for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // CHECK status using the prediction_id
      const checkResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction_id: prediction.id })
      });

      if (!checkResponse.ok) throw new Error("Failed to check AI status");
      prediction = await checkResponse.json();
    }

    // 3. FINISH: Return the final image URL
    if (prediction.status === 'succeeded') {
      // Replicate usually returns an array [url], but sometimes just a string
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