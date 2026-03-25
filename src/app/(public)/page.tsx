import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900 lg:px-20 px-6">
         {/* Background elements */}
         <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-pink-500/10 blur-[150px] rounded-full"></div>
         </div>

         <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
            <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-400/20 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
               Play for Change
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.95] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
               Score Points.<br/>
               <span className="bg-linear-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">Power Progress.</span>
            </h1>
            <p className="max-w-xl text-indigo-200/60 text-lg md:text-xl font-medium leading-relaxed mb-12 animate-in fade-in zoom-in duration-1000 delay-300">
               The subscription platform where your monthly golf scores fuel charities worldwide and enter you into life-changing prize draws.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500">
               <Link href="/signup" className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all">
                  Start Contributing
               </Link>
               <Link href="/how-it-works" className="bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-indigo-500/20 transition-all">
                  Explore Impact
               </Link>
            </div>
         </div>
      </section>

      {/* Impact Stats */}
      <section className="py-24 bg-white border-y border-slate-100">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <div className="flex flex-col items-center">
               <span className="text-6xl font-black text-slate-900 tracking-tighter mb-4">£1.2M+</span>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Donated To Date</p>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-6xl font-black text-slate-900 tracking-tighter mb-4">15k</span>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Active Subscribers</p>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-6xl font-black text-slate-900 tracking-tighter mb-4">£45k</span>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Next Month's Jackpot</p>
            </div>
         </div>
      </section>

      {/* Featured Charity */}
      <section className="py-32 px-6">
         <div className="max-w-7xl mx-auto bg-slate-900 rounded-[3rem] overflow-hidden p-1 lg:p-12 relative">
            <div className="absolute top-0 right-0 w-[50%] h-full bg-indigo-600/10 blur-[120px] rounded-full"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16 p-8 lg:p-0">
               <div className="lg:w-1/2 aspect-square rounded-4xl bg-indigo-500/5 overflow-hidden border border-white/5">
                  <div className="w-full h-full flex items-center justify-center text-indigo-200/20 font-black text-4xl uppercase tracking-tighter">Charity Spotlight</div>
               </div>
               <div className="lg:w-1/2 space-y-8">
                  <span className="text-indigo-400 font-black uppercase text-xs tracking-widest">Featured Partner</span>
                  <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter">Ocean Cleanup Project</h2>
                  <p className="text-indigo-200/60 font-medium text-lg leading-relaxed">
                     Protecting our fairways and our oceans. Every score you log helps remove 5kg of plastic from the Pacific Ocean this month.
                  </p>
                  <Link href="/charities" className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-xl">
                     Support This Impact &rarr;
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* How it Works Summary */}
      <section className="py-32 bg-slate-50">
         <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-center text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-20">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <HowCard step="01" title="Subscribe" desc="Join for £10/mo. Select your charity and your impact level." />
               <HowCard step="02" title="Log Scores" desc="Enter your last 5 Stableford scores. No clubs required." />
               <HowCard step="03" title="Win & Donate" desc="Match numbers to win cash prizes while we handle the donation." />
            </div>
         </div>
      </section>
      
      {/* Social Proof */}
      <section className="py-32 border-t border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
           <h3 className="text-2xl font-black text-slate-900 mb-8 font-serif italic text-center leading-relaxed">"The only thing better than a birdie is knowing your score just funded a clean water well."</h3>
           <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-200"></div>
              <p className="font-bold text-slate-900">Marcus Wright</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Subscriber since 2024</p>
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto bg-indigo-600 rounded-[3rem] p-16 text-center shadow-2xl shadow-indigo-200">
           <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-8 leading-none">Ready to Change<br/>the Game?</h2>
           <p className="text-indigo-100 text-xl font-medium mb-12 max-w-xl mx-auto opacity-80">Join 15,000+ golfers turning their hobby into a global force for good.</p>
           <Link href="/signup" className="inline-block bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:scale-110 active:scale-95 transition-all">
              Sign Up Now
           </Link>
        </div>
      </section>
    </div>
  )
}

function HowCard({ step, title, desc }: { step: string, title: string, desc: string }) {
   return (
      <div className="group bg-white p-10 rounded-3xl shadow-sm hover:shadow-2xl transition-all border border-slate-100 ring-1 ring-slate-900/5">
         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-4 block">{step}</span>
         <h4 className="text-2xl font-black text-slate-900 mb-4">{title}</h4>
         <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
   )
}
