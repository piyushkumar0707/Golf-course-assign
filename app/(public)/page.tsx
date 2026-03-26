import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/shared/FadeIn'

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-24 pb-32">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center max-w-3xl mx-auto text-center space-y-8">
            <FadeIn>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                Play Golf. <span className="text-primary">Make an Impact.</span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join our premium subscription platform. Track your latest 5 rounds, 
                compete in our monthly algorithmic prize draws, and seamlessly donate 
                a portion of your membership to life-changing charities.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-lg h-12 px-8">
                    Start Making an Impact
                  </Button>
                </Link>
                <Link href="/how-it-works" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full text-lg h-12 px-8">
                    How it Works
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
        
        {/* Subtle background element */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#fee2e2_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#4c0519_100%)]"></div>
      </section>

      {/* Stats/Why Join Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <FadeIn delay={0.1}>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold">Play & Record</h3>
                <p className="text-muted-foreground">
                  Your rolling recent 5 scores dictate your standing. Just play your game and enter your Stableford points.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold">Win Big</h3>
                <p className="text-muted-foreground">
                  Our transparent monthly draw engine matches your scores against the winning numbers for a cut of the prize pool.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold">Give Back</h3>
                <p className="text-muted-foreground">
                  Choose your preferred charity and allocate up to 100% of your net subscription fee to support their cause.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  )
}
