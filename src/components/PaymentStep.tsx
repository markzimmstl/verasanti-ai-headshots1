import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { Check, Shield, Sparkles, AlertCircle, Zap, Mail } from 'lucide-react';

interface PaymentStepProps {
  imageCount: number;
  onPaymentComplete: (purchasedCredits: number) => void;
  onBack: () => void;
  userEmail?: string; // pre-filled from logged-in account — skips email modal
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  isPopular?: boolean;
  features: string[];
  stripeLink: string;
}

const TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    credits: 40,
    description: 'Perfect for a LinkedIn profile or headshot refresh.',
    features: ['40 AI Credits', '20+ Brand Photos', 'Commercial License'],
    stripeLink: 'https://link.contentcreatormachine.com/payment-link/69a6409be005be6a1182f70e',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    credits: 120,
    description: 'Variety across scenes for your website and social media.',
    isPopular: true,
    features: ['120 AI Credits', '60–100 Brand Photos', 'Multiple Scenes & Styles', 'Priority Processing'],
    stripeLink: 'https://link.contentcreatormachine.com/payment-link/69a640743413b5667afe7fa6',
  },
  {
    id: 'brandkit',
    name: 'Brand Kit',
    price: 119,
    credits: 300,
    description: 'Maximum variety for a full brand launch or team.',
    features: ['300 AI Credits', '150+ Brand Photos', 'Highest Priority', 'Team License'],
    stripeLink: 'https://link.contentcreatormachine.com/payment-link/69a640003413b532c8fe7f1f',
  },
];

export const PaymentStep: React.FC<PaymentStepProps> = ({ imageCount, onPaymentComplete, onBack, userEmail }) => {
  const [selectedTierId, setSelectedTierId] = useState<string>('professional');
  const [email, setEmail] = useState(userEmail || '');
  const [isEmailSaved, setIsEmailSaved] = useState(!!userEmail); // skip modal if logged in
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedTier = TIERS.find(t => t.id === selectedTierId) || TIERS[1];
  const insufficientCredits = selectedTier.credits < imageCount;

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) setIsEmailSaved(true);
  };

  const handlePay = () => {
    if (!email || isProcessing) return;
    setIsProcessing(true);
    const stripeUrl = `${selectedTier.stripeLink}?prefilled_email=${encodeURIComponent(email)}`;
    window.location.href = stripeUrl;
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in px-4 pb-32">

      {/* Email capture modal */}
      {!isEmailSaved && (
        <div
          className="fixed inset-0 z-50 flex justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
          style={{ alignItems: 'flex-start', paddingTop: '12vh' }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-indigo-500/10 rounded-full flex items-center justify-center ring-1 ring-indigo-500/30">
                <Sparkles className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">Save Your Brand Kit</h3>
            <p className="text-slate-400 text-center mb-6">Enter your email to save your configuration and view pricing.</p>
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <Button className="w-full py-3">Save & Continue</Button>
            </form>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`${!isEmailSaved ? 'blur-sm opacity-40 pointer-events-none select-none' : ''} transition-all duration-500`}>

        {/* Header */}
        <div className="text-center mb-10 pt-2">
          <h2 className="text-4xl font-bold text-white mb-4">Build Your Personal Brand</h2>
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-3 bg-indigo-900/30 border border-indigo-500/30 rounded-full px-6 py-2">
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <p className="text-indigo-200 text-xl font-bold">1 Credit = 1 AI-Generated Image</p>
            </div>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Your very own Personal Brand Image System</p>
          </div>
        </div>

        {/* Pricing tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTierId(tier.id)}
              className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                selectedTierId === tier.id
                  ? 'bg-indigo-900/20 border-indigo-500 shadow-2xl scale-105 z-10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{tier.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${tier.price}</span>
                <span className="ml-2 inline-block bg-slate-800 text-indigo-300 text-xs font-bold px-2 py-1 rounded">
                  {tier.credits} Credits
                </span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className={`w-full py-2 rounded-lg text-center text-sm font-bold transition-colors ${
                selectedTierId === tier.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {selectedTierId === tier.id ? '✓ Selected' : 'Select Plan'}
              </div>
            </div>
          ))}
        </div>

        {/* Insufficient credits warning */}
        {insufficientCredits && (
          <div className="flex gap-2 items-start bg-amber-950/40 border border-amber-500/30 text-amber-300 p-4 rounded-xl text-sm mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Your selected image count exceeds this plan's credits. Consider upgrading to Professional or Brand Kit.</p>
          </div>
        )}

        {/* ── CHECKOUT BAR ── */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white font-bold text-lg">{selectedTier.name}</span>
                <span className="text-slate-400 text-sm">·</span>
                <span className="text-indigo-300 text-sm font-medium">{selectedTier.credits} credits</span>
                <span className="text-slate-400 text-sm">·</span>
                <span className="text-white font-bold text-xl">${selectedTier.price}</span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Promo code? Enter it at Stripe checkout.&nbsp;&nbsp;
                <span className="inline-flex items-center gap-1">
                  <Shield className="w-3 h-3 text-green-500" />
                  Secured by Stripe
                </span>
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handlePay}
              disabled={isProcessing || !email}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] whitespace-nowrap"
            >
              {isProcessing ? 'Redirecting...' : `Continue to Secure Checkout — $${selectedTier.price}`}
            </button>
          </div>
        </div>

        {/* Back */}
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onBack} disabled={isProcessing}>Back</Button>
        </div>
      </div>
    </div>
  );
};
