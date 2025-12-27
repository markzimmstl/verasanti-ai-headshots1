import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { Check, Shield, CreditCard, Sparkles, AlertCircle, Zap, Star, Mail, FileText } from 'lucide-react';

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
}

const TIERS: PricingTier[] = [
  { id: 'essential', name: 'Professional Starter', price: 39, credits: 40, description: 'Perfect for a LinkedIn profile.', features: ['40 AI Credits', '20+ Photos', 'Commercial License'] },
  { id: 'pro', name: 'Executive Growth', price: 69, credits: 120, description: 'Variety for website & social.', isPopular: true, features: ['120 AI Credits', '60-100 Photos', 'Priority Processing'] },
  { id: 'exec', name: 'Chairman / Team', price: 99, credits: 300, description: 'Maximum options.', features: ['300 AI Credits', '150+ Photos', 'Highest Priority', 'Team License'] }
];

export const PaymentStep: React.FC<PaymentStepProps> = ({ imageCount, onPaymentComplete, onBack }) => {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isEmailSaved, setIsEmailSaved] = useState(false);
  const [companyCode, setCompanyCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (!selectedTierId) {
      if (imageCount > 100) setSelectedTierId('exec');
      else if (imageCount > 35) setSelectedTierId('pro');
      else setSelectedTierId('essential');
    }
  }, [imageCount, selectedTierId]);

  const selectedTier = TIERS.find(t => t.id === selectedTierId) || TIERS[1];
  const insufficientCredits = selectedTier.credits < imageCount;

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) setIsEmailSaved(true);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const normalizedCode = companyCode.trim().toUpperCase();
    if (normalizedCode === 'VIP-TEST' || normalizedCode === 'PARTNER-2026') {
        setIsProcessing(true);
        setTimeout(() => { setIsProcessing(false); onPaymentComplete(normalizedCode === 'PARTNER-2026' ? 300 : 120); }, 1000);
        return;
    }
    if (insufficientCredits && !window.confirm(`You need ${imageCount} credits but selected pack has ${selectedTier.credits}. Proceed?`)) return;
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); onPaymentComplete(selectedTier.credits); }, 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in px-4 pb-12 relative">
      {!isEmailSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6"><div className="h-16 w-16 bg-indigo-500/10 rounded-full flex items-center justify-center ring-1 ring-indigo-500/30"><Sparkles className="h-8 w-8 text-indigo-400" /></div></div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">Save Your Brand Kit</h3>
            <p className="text-slate-400 text-center mb-6">Enter your email to save your configuration and view pricing.</p>
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Work Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={handleInputFocus} placeholder="name@company.com" className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" required autoFocus /></div></div>
              <Button className="w-full py-3">Save & Continue</Button>
            </form>
          </div>
        </div>
      )}

      <div className={`${!isEmailSaved ? 'blur-sm opacity-50 pointer-events-none' : ''} transition-all duration-500`}>
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-white mb-6">Invest in Your Personal Brand</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-3 bg-indigo-900/30 border border-indigo-500/30 rounded-full px-6 py-2"><Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /><p className="text-indigo-200 text-xl font-bold">1 Credit = 1 Image Generation</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier) => (
            <div key={tier.id} onClick={() => setSelectedTierId(tier.id)} className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${selectedTierId === tier.id ? 'bg-indigo-900/20 border-indigo-500 shadow-2xl transform scale-105 z-10' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'}`}>
              {tier.isPopular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">RECOMMENDED</div>}
              <div className="mb-4"><h3 className="text-xl font-bold text-white">{tier.name}</h3><p className="text-slate-400 text-sm mt-1">{tier.description}</p></div>
              <div className="mb-6"><div className="flex items-baseline gap-1"><span className="text-4xl font-bold text-white">${tier.price}</span></div><div className="mt-2 inline-block bg-slate-800 text-indigo-300 text-xs font-bold px-2 py-1 rounded">{tier.credits} Credits</div></div>
              <ul className="space-y-3 mb-8 flex-1">{tier.features.map((feat, idx) => <li key={idx} className="flex items-start gap-3 text-sm text-slate-300"><Check className="h-4 w-4 shrink-0 text-slate-600" /><span>{feat}</span></li>)}</ul>
              <div className={`w-full py-2 rounded-lg text-center text-sm font-bold transition-colors ${selectedTierId === tier.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{selectedTierId === tier.id ? 'Selected' : 'Select Plan'}</div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2 space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">Secure Checkout</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-2"><span className="font-semibold text-slate-700">{selectedTier.name}</span><span className="font-bold text-slate-900">${selectedTier.price}</span></div>
                    <div className="flex justify-between items-center text-sm text-slate-500"><span>Credits included</span><span>{selectedTier.credits}</span></div>
                    {insufficientCredits && <div className="mt-4 flex gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-xs border border-amber-200"><AlertCircle className="w-4 h-4 shrink-0" /><p>You need more credits for your plan.</p></div>}
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-sm"><div className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-600" /><span>Data Encrypted</span></div></div>
              </div>

              <div className="md:w-1/2">
                <form onSubmit={handlePay} className="space-y-4">
                  <div className="opacity-50 pointer-events-none"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input type="email" value={email} readOnly className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-3 text-slate-600" /></div>
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Credit Card</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                        <div className="relative"><CreditCard className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" onFocus={handleInputFocus} placeholder="Card number" className="w-full bg-transparent pl-6 outline-none text-slate-900 placeholder:text-slate-400 font-mono" /></div>
                        <div className="flex gap-4 border-t border-slate-200 pt-3"><input type="text" onFocus={handleInputFocus} placeholder="MM / YY" className="w-1/2 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-mono" /><input type="text" onFocus={handleInputFocus} placeholder="CVC" className="w-1/2 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-mono" /></div>
                    </div>
                  </div>
                   <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Code</label>
                    <input type="text" placeholder="Optional Code" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 outline-none" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} onFocus={handleInputFocus} />
                  </div>
                  <button type="submit" disabled={isProcessing} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70">{isProcessing ? 'Verifying...' : `Pay $${selectedTier.price}`}</button>
                </form>
              </div>
          </div>
        </div>
        <div className="mt-8 text-center"><Button variant="outline" onClick={onBack} disabled={isProcessing}>Back</Button></div>
      </div>
    </div>
  );
};