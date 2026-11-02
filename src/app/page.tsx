// src/app/page.tsx
// Landing page - TODO: implement

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4">ShouldISay</h1>
        <p className="text-muted-foreground mb-8">
          Analyze your tone before you send. Communicate more thoughtfully.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-md">
            Sign In
          </a>
          <a href="/register" className="px-6 py-3 border border-input rounded-md">
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}