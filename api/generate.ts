// @ts-nocheck
const REPLICATE_API_TOKEN = process.env.VITE_REPLICATE_API_TOKEN;

export default async function handler(req: Request) {
  const body = await req.json();
  const { prompt, image, aspect_ratio, prediction_id } = body;

  // IF WE ALREADY HAVE AN ID, WE ARE CHECKING STATUS
  if (prediction_id) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${prediction_id}`, {
      headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
    });
    const result = await response.json();
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  }

  // OTHERWISE, WE ARE STARTING A NEW JOB
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "f429676579b47e279434444988755695029a1b15174092b7672ecf1ca4740263",
      input: { prompt, image, aspect_ratio, output_format: "png" }
    }),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
}