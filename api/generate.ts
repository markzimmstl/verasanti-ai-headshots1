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

    // MODE B: Flux 2 Flex - Validation Fixed
    // We ensure the aspect_ratio matches Replicate's specific enum list
    const normalized = (aspect_ratio || "1:1").replace("/", ":");
    const validAspectRatio = ["1:1", "16:9", "3:2", "2:3", "4:5", "5:4", "9:16", "3:4", "4:3"].includes(normalized)
      ? normalized
      : "1:1";

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
        model: "black-forest-labs/flux-2-flex",
        input: {
          prompt: prompt,
          input_images: [image.trim()],
          aspect_ratio: validAspectRatio,
          output_format: "webp",
          guidance: 3.5,
          steps: 30,
          prompt_upsampling: false
        },
      }),
    });

    const result = await response.json();
    
    if (response.status === 422) {
      console.error("REPLICATE VALIDATION ERROR:", JSON.stringify(result));
      return new Response(JSON.stringify(result), { status: 422 });
    }

    return new Response(JSON.stringify(result), { status: 200 });

  } catch (error) {
    console.error("CRITICAL API ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
