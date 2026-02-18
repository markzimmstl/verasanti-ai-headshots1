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
  console.log("API CALLED WITH:", { prompt: prompt?.slice(0,50), hasImage: !!image, aspect_ratio, prediction_id });

  if (!REPLICATE_API_TOKEN) {
    return new Response(JSON.stringify({ error: "API Token Missing" }), { status: 500 });
  }

  try {
    // MODE A: Checking status of existing prediction
    if (prediction_id) {
      const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-2-flex/predictions", {
        headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
      });
      const result = await response.json();
      return new Response(JSON.stringify(result), { status: 200 });
    }

    // MODE B: Start a new Flux 2 Flex generation
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
         input: {
          prompt: prompt,
          input_images: [image.trim()],
          aspect_ratio: validAspectRatio,
          output_format: "webp",
          guidance: 3.5,
          steps: 20,
          prompt_upsampling: false
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("REPLICATE ERROR STATUS:", response.status);
      console.error("REPLICATE ERROR BODY:", JSON.stringify(result));
      return new Response(JSON.stringify({
        error: result?.detail || result?.error || JSON.stringify(result),
        replicateStatus: response.status,
        fullResponse: result
      }), { status: response.status });
    }

    return new Response(JSON.stringify(result), { status: 200 });

  } catch (error) {
    console.error("CRITICAL API ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
