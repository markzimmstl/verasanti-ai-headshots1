// This file runs on Vercel's servers, NOT in the browser.
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { prompt, image, aspect_ratio } = await req.json();

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.VITE_REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait"
    },
    body: JSON.stringify({
      version: "black-forest-labs/flux-schnell",
      input: { prompt, image, aspect_ratio, output_format: "png" }
    }),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}