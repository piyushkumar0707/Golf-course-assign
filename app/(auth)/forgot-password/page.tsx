export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground mt-2">Enter your email to receive a reset link.</p>
        </div>
        <form action="/api/auth/reset-password" method="POST" className="space-y-4">
          <input type="email" name="email" required placeholder="your@email.com"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
          <button type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  )
}
