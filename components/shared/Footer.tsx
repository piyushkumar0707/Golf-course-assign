import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built to make an impact. © {new Date().getFullYear()} Fairway Funders.
        </p>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
