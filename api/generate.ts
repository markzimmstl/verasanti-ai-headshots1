// @ts-nocheck
const REPLICATE_API_TOKEN = process.env.VITE_REPLICATE_API_TOKEN;

export default async function handler(req, res) {
  // 1. UNIVERSAL BODY PARSING
  // This handles both Vercel's standard Node.js environment and Edge environment
  let data;
  try {
    if (req.body) {
      data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else {
      data = await req.json();
    }
  } catch (e) {
    console.error("Parsing error:", e);
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const { prompt, image, aspect_ratio, prediction_id } = data;

  try {
    // MODE A: Checking status
    if (prediction_id) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${prediction_id}`, {
        headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
      });
      const result = await response.json();
      // Use the standard Response object for Vercel
      return new Response(JSON.stringify(result), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // MODE B: Starting a new job
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "f429676579b47e279434444988755695029a1b15174092b7672ecf1ca4740263",
        input: { 
          prompt: prompt, 
          image: image, 
          aspect_ratio: aspect_ratio, 
          output_format: "png" 
        }
      }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}