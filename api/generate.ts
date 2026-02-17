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

    // MODE B: Flux 2 Flex - 2026 Corrected Schema
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Using the official model path string
        version: "black-forest-labs/flux-2-flex",
        input: {
          prompt: prompt,
          input_images: [image.trim()], // Ensure no trailing spaces in base64
          aspect_ratio: aspect_ratio || "1:1",
          output_format: "webp",
          guidance: 3.5,
          steps: 20,
          prompt_upsampling: false // Keeps your Peter Hurley technical terms intact
        },
      }),
    });

    const result = await response.json();
    
    // Catch specific Replicate validation errors
    if (response.status === 422) {
      console.error("Replicate Schema Error:", JSON.stringify(result.detail));
      return new Response(JSON.stringify({ error: "Schema Mismatch", details: result.detail }), { status: 422 });
    }

    return new Response(JSON.stringify(result), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}