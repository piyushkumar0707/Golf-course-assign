import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center font-black text-white text-xl">G</div>
            <span className="font-black text-white text-xl tracking-tight">Golf Charity</span>
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Welcome</h1>
          <p className="text-indigo-200/60 font-medium">Support charities. Play golf. Win prizes.</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
          {children}
        </div>

        {/* Footer links */}
        <div className="mt-8 text-center text-sm text-indigo-200/60">
          <p>By continuing, you agree to our <Link href="#" className="text-indigo-400 hover:text-indigo-300 font-semibold">Terms of Service</Link></p>
        </div>
      </div>
    </div>
  )
}
