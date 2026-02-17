// @ts-nocheck
export const config = { runtime: 'edge' };

const REPLICATE_API_TOKEN = process.env.VITE_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN;

export default async function handler(req) {
  let data;
  try {
    data = await req.json();
  } catch (e) {
    data = req.body;
  }

  const { prompt, image, aspect_ratio, prediction_id } = data;

  if (!REPLICATE_API_TOKEN) {
    return new Response(JSON.stringify({ error: "API Token Missing" }), { status: 500 });
  }

  try {
    // MODE A: Checking status
    if (prediction_id) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${prediction_id}`, {
        headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
      });
      const result = await response.json();
      return new Response(JSON.stringify(result), { status: 200 });
    }

    // MODE B: Flux 2 Flex - 2026 Standard Handshake
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Updated to the exact model path for the Flex variant
        version: "black-forest-labs/flux-2-flex",
        input: {
          prompt: prompt,
          // Explicitly naming the array and ensuring no extra spaces
          input_images: [image.trim()], 
          aspect_ratio: aspect_ratio || "1:1",
          output_format: "webp",
          guidance: 4.5,
          steps: 20
        },
      }),
    });

    const result = await response.json();
    
    // Check if Replicate rejected it with a specific message
    if (result.status === 422 || result.detail) {
      console.error("Validation Error Details:", result.detail);
      return new Response(JSON.stringify({ 
        error: "Validation Failed", 
        details: result.detail 
      }), { status: 422 });
    }

    return new Response(JSON.stringify(result), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}