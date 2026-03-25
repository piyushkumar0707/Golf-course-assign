export default function HowItWorksPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-24">
           <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-tight">Your Scores.<br/>Their Success.</h1>
           <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-2xl mx-auto italic">Learn how we turn a simple 18-hole score into life-changing impact and prizes.</p>
        </div>

        <div className="space-y-32">
           <ProcessStep 
             step="01" 
             title="The Subscription" 
             desc="Join for as little as £10 per month. 100% of your platform fee (after VAT and payment processing) is earmarked for charitable causes. By default, 10% goes to your selected charity, but you can increase this up to 100% in your dashboard." 
             imageAlt="Subscription Dashboard"
           />
           <ProcessStep 
             step="02" 
             title="The Score Entry" 
             desc="After every round, log your Stableford score (points between 1–45). We maintain your last 5 scores. These five numbers are your entry into the monthly draw. No 5 scores, no entry. It's that simple." 
             imageAlt="Score Entry Screen"
             reversed
           />
           <ProcessStep 
             step="03" 
             title="The Monthly Draw" 
             desc="At the end of every month, we generate 5 winning numbers using a weighted algorithm based on the global distribution of all scores logged. If your numbers match, you win from the prize pool." 
             imageAlt="Draw Animation"
           />
           <ProcessStep 
             step="04" 
             title="Tiers & Payouts" 
             desc="Match 3, 4, or all 5 numbers to win. Match all 5 to claim the Jackpot. If no one matches 5, the jackpot rolls over to the next month making the next draw even bigger." 
             imageAlt="Prize Distribution"
             reversed
           />
        </div>
        
        <div className="mt-40 bg-indigo-900 p-16 rounded-[4rem] text-center shadow-2xl relative overflow-hidden ring-1 ring-white/10">
           <div className="absolute inset-0 bg-indigo-400/5 blur-[100px] rounded-full"></div>
           <h2 className="relative z-10 text-3xl font-black text-white uppercase tracking-widest mb-8">Ready to play?</h2>
           <a href="/signup" className="relative z-10 inline-block bg-white text-indigo-900 px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 active:scale-95 transition-all">Create Account</a>
        </div>
      </div>
    </div>
  )
}

function ProcessStep({ step, title, desc, imageAlt, reversed = false }: { step: string, title: string, desc: string, imageAlt: string, reversed?: boolean }) {
   return (
      <div className={`flex flex-col lg:flex-row gap-16 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
         <div className="lg:w-1/2 space-y-6">
            <span className="text-indigo-500 font-black uppercase text-sm tracking-widest italic">{step}</span>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">{title}</h3>
            <p className="text-slate-600 font-medium text-lg leading-relaxed">{desc}</p>
         </div>
         <div className="lg:w-1/2 aspect-square bg-white rounded-[3rem] shadow-xl border border-slate-100 ring-1 ring-slate-900/5 flex items-center justify-center p-8 transition-transform hover:scale-105">
            <div className="w-full h-full bg-slate-50 rounded-4xl border border-slate-100 flex flex-col items-center justify-center text-center p-8 gap-4 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 font-black text-[10px] text-slate-200 tracking-widest uppercase">Visualization Preview</div>
               <span className="text-4xl filter grayscale opacity-20">📊</span>
               <p className="text-slate-300 font-bold uppercase text-xs tracking-widest">{imageAlt}</p>
            </div>
         </div>
      </div>
   )
}
