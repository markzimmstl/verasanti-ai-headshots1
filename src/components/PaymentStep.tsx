import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { Check, Shield, Sparkles, AlertCircle, Zap, Mail } from 'lucide-react';

interface PaymentStepProps {
  imageCount: number;
  onPaymentComplete: (purchasedCredits: number) => void;
  onBack: () => void;
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
    stripeLink: 'https://buy.stripe.com/eVq28sc6b0Ft2hn17pdUY02',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    credits: 120,
    description: 'Variety across scenes for your website and social media.',
    isPopular: true,
    features: ['120 AI Credits', '60–100 Brand Photos', 'Multiple Scenes & Styles', 'Priority Processing'],
    stripeLink: 'https://buy.stripe.com/7sY3cwb27ewjcW16rJdUY01',
  },
  {
    id: 'brandkit',
    name: 'Brand Kit',
    price: 119,
    credits: 300,
    description: 'Maximum variety for a full brand launch or team.',
    features: ['300 AI Credits', '150+ Brand Photos', 'Highest Priority', 'Team License'],
    stripeLink: 'https://buy.stripe.com/4gM5kEb27ag3e053fxdUY00',
  },
];

export const PaymentStep: React.FC<PaymentStepProps> = ({ imageCount, onPaymentComplete, onBack }) => {
  // Default to Professional — no useEffect override
  const [selectedTierId, setSelectedTierId] = useState<string>('professional');
  const [email, setEmail] = useState('');
  const [isEmailSaved, setIsEmailSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedTier = TIERS.find(t => t.id === selectedTierId) || TIERS[1];
  const insufficientCredits = selectedTier.credits < imageCount;

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) setIsEmailSaved(true);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsProcessing(true);
    const stripeUrl = `${selectedTier.stripeLink}?prefilled_email=${encodeURIComponent(email)}`;
    window.location.href = stripeUrl;
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in px-4 pb-12 relative">

      {/* Email capture modal — positioned in upper third of viewport */}
      {!isEmailSaved && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
             style={{ paddingTop: '12vh' }}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-indigo-500/10 rounded-full flex items-center justify-center ring-1 ring-indigo-500/30">
                <Sparkles className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">Almost There</h3>
            <p className="text-slate-400 text-center mb-6">Enter your email to save your brand configuration and view pricing.</p>
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <Button className="w-full py-3">View Pricing</Button>
            </form>
          </div>
        </div>
      )}

      <div className={`${!isEmailSaved ? 'blur-sm opacity-50 pointer-events-none' : ''} transition-all duration-500`}>

        {/* Header */}
        <div className="text-center mb-10">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTierId(tier.id)}
              className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                selectedTierId === tier.id
                  ? 'bg-indigo-900/20 border-indigo-500 shadow-2xl transform scale-105 z-10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{tier.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${tier.price}</span>
                <div className="mt-2 inline-block bg-slate-800 text-indigo-300 text-xs font-bold px-2 py-1 rounded ml-2">
                  {tier.credits} Credits
                </div>
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

        {/* Checkout box — vertically centered on screen */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-20"
             style={{ display: isEmailSaved ? 'flex' : 'none' }}>
          <div className="pointer-events-auto max-w-lg w-full mx-4 bg-white text-slate-900 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-1">Continue</h3>
            <p className="text-slate-500 text-sm mb-6">
              You'll be securely redirected to Stripe. Promo codes can be entered there. You'll return here automatically after payment.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-700">{selectedTier.name}</span>
                <span className="font-bold text-slate-900">${selectedTier.price}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Credits included</span>
                <span>{selectedTier.credits}</span>
              </div>
              {insufficientCredits && (
                <div className="mt-4 flex gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-xs border border-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>Your selected image count exceeds this plan's credits. Consider upgrading to Professional or Brand Kit.</p>
                </div>
              )}
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div className="opacity-60 pointer-events-none">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-3 text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70"
              >
                {isProcessing ? 'Redirecting to Stripe...' : `Continue to Secure Checkout — $${selectedTier.price}`}
              </button>

              <div className="flex items-center justify-center gap-3 text-slate-400 text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-green-600" />
                  <span>Secured by Stripe</span>
                </div>
                <span>·</span>
                <span>Promo codes accepted at checkout</span>
              </div>
            </form>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-96" />

        <div className="mt-8 text-center relative z-30">
          <Button variant="outline" onClick={onBack} disabled={isProcessing}>Back</Button>
        </div>
      </div>
    </div>
  );
};
