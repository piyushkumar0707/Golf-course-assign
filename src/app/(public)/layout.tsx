'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { user, role, loading } = useUser()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-slate-900 tracking-tighter">
           GOLF CHARITY <span className="text-indigo-600">.</span>
        </Link>
        <nav className="hidden md:flex gap-10 items-center">
           <Link href="/how-it-works" className="text-slate-600 font-bold uppercase text-xs tracking-widest hover:text-indigo-600 transition-colors">How it works</Link>
           <Link href="/charities" className="text-slate-600 font-bold uppercase text-xs tracking-widest hover:text-indigo-600 transition-colors">Charities</Link>
           <Link href="/draws" className="text-slate-600 font-bold uppercase text-xs tracking-widest hover:text-indigo-600 transition-colors">Past Draws</Link>
        </nav>
        <div className="flex gap-4 items-center">
           {!user && !loading ? (
             <>
                <Link href="/login" className="text-slate-600 font-bold uppercase text-xs tracking-widest hover:text-indigo-600">Log In</Link>
                <Link href="/signup" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Sign Up</Link>
             </>
           ) : (
             <Link href="/dashboard" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                Go to Dashboard
             </Link>
           )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-20 px-6 border-t border-slate-900">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="col-span-2 space-y-8">
               <h3 className="text-3xl font-black tracking-tighter">GOLF CHARITY <span className="text-indigo-500">.</span></h3>
               <p className="text-slate-400 font-medium leading-relaxed max-w-sm">The subscription platform where your monthly golf scores fuel charities worldwide and enter you into life-changing prize draws.</p>
               <div className="flex gap-4">
                  <span className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800"></span>
                  <span className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800"></span>
                  <span className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800"></span>
               </div>
            </div>
            <div className="space-y-6">
               <h4 className="text-indigo-500 font-black uppercase text-xs tracking-widest">Platform</h4>
               <ul className="space-y-4">
                  <li><Link href="/how-it-works" className="text-slate-400 font-bold text-sm tracking-tight hover:text-white transition-colors">How it works</Link></li>
                  <li><Link href="/charities" className="text-slate-400 font-bold text-sm tracking-tight hover:text-white transition-colors">Charity Directory</Link></li>
                  <li><Link href="/draws" className="text-slate-400 font-bold text-sm tracking-tight hover:text-white transition-colors">Previous Winners</Link></li>
               </ul>
            </div>
            <div className="space-y-6">
               <h4 className="text-indigo-500 font-black uppercase text-xs tracking-widest">Support</h4>
               <ul className="space-y-4">
                  <li><Link href="/privacy" className="text-slate-400 font-bold text-sm tracking-tight hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-slate-400 font-bold text-sm tracking-tight hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/contact" className="text-slate-400 font-bold text-sm tracking-tight hover:text-white transition-colors">Help Center</Link></li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-900 flex justify-between items-center text-slate-500 text-[10px] uppercase font-black tracking-widest">
            <p>&copy; 2024 Golf Charity Platform Ltd.</p>
            <p>Built with ❤️ for Global Impact</p>
         </div>
      </footer>
    </div>
  )
}
