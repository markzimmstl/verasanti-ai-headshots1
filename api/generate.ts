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

    // MODE B: Starting a new job
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Using the latest Flux Schnell version string
        version: "f429676579b47e279434444988755695029a1b15174092b7672ecf1ca4740263",
        input: {
          prompt: prompt,
          image: image,
          aspect_ratio: aspect_ratio || "1:1",
          output_format: "webp" // WebP is faster/smaller for the AI to return
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