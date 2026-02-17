// @ts-nocheck
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // 1. Get the token (Vercel Edge uses simple process.env)
  const REPLICATE_API_TOKEN = process.env.VITE_REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return new Response(JSON.stringify({ error: "API Token Missing in Vercel" }), { status: 500 });
  }

  // 2. Parse the incoming data
  const body = await req.json();
  const { prompt, image, aspect_ratio, prediction_id } = body;

  try {
    // MODE A: Checking status
    if (prediction_id) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${prediction_id}`, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        },
      });
      const result = await response.json();
      return new Response(JSON.stringify(result), { status: 200 });
    }

    // MODE B: Starting a new job with Flux 2 Flex
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // The 2026 Flux 2 Flex Model
            version: "black-forest-labs/flux-2-flex",
            input: {
              prompt: prompt,
              image: image, // Your reference photo
              structure_coherence: 0.9, // Keeps the face shape identical
              identity_strength: 0.8, // Ensures it looks like the user
              guidance_scale: 3.5,
              output_format: "webp",
              num_outputs: 1
            },
          }),
        });

    const result = await response.json();

    // If Replicate returns an error (like "Invalid Token"), we want to see it!
    if (result.detail || result.error) {
      return new Response(JSON.stringify({ error: result.detail || result.error }), { status: 400 });
    }

    return new Response(JSON.stringify(result), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}