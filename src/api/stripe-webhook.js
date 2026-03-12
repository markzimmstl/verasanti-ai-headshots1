// api/stripe-webhook.js
// Vercel serverless function — place this file at /src/api/stripe-webhook.js in your project

// Valid tier values — must match exactly what's in your Stripe success URLs
const VALID_TIERS = [
  'starter',
  'professional',
  'brand_kit',
  'topup_starter',
  'topup_professional',
  'topup_brand_kit',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;

    // Only handle checkout completions
    if (event.type !== 'checkout.session.completed') {
      return res.status(200).json({ received: true });
    }

    const session = event.data.object;

    // Extract tier from success_url
    // e.g. https://app.veralooks.com?payment=success&credits=40&tier=starter
    const successUrl = session.success_url || '';
    const tierMatch = successUrl.match(/[?&]tier=([^&]+)/);
    const tier = tierMatch ? tierMatch[1] : null;

    if (!tier || !VALID_TIERS.includes(tier)) {
      console.error(`Invalid or missing tier "${tier}" in success_url: ${successUrl}`);
      return res.status(200).json({ received: true, warning: `Invalid tier: ${tier}` });
    }

    // Extract customer details from Stripe payload
    const customerDetails = session.customer_details || {};
    const email = customerDetails.email || '';
    const name  = customerDetails.name  || '';
    const phone = customerDetails.phone || '';
    const amountTotal = (session.amount_total || 0) / 100; // convert cents to dollars

    // Build the payload for CC Machine inbound webhook
    const ccMachinePayload = {
      email,
      name,
      phone,
      tier,             // "starter" | "professional" | "brand_kit" | "topup_*"
      amount: amountTotal,
      payment_status: session.payment_status,
      stripe_session_id: session.id,
      payment_link: session.payment_link || '',
    };

    // Forward to CC Machine inbound webhook
    const CCM_WEBHOOK_URL = process.env.CCM_WEBHOOK_URL;

    if (!CCM_WEBHOOK_URL) {
      console.error('CCM_WEBHOOK_URL environment variable not set');
      return res.status(500).json({ error: 'CCM webhook URL not configured' });
    }

    const ccmResponse = await fetch(CCM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ccMachinePayload),
    });

    if (!ccmResponse.ok) {
      console.error('CC Machine webhook failed:', ccmResponse.status);
      return res.status(500).json({ error: 'Failed to forward to CC Machine' });
    }

    console.log(`Successfully forwarded tier="${tier}" for ${email} to CC Machine`);
    return res.status(200).json({ received: true, tier, email });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}