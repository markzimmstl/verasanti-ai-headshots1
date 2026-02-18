import { GenerationConfig, MultiReferenceSet } from "../types.ts";

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
    BACKGROUND: ${stylePrompt}.
    MOOD: Confident, approachable, and professional.
  `;

  // Format the image as a proper data URI so Replicate accepts it
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
