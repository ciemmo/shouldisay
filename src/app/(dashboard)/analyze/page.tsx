// src/app/(dashboard)/analyze/page.tsx
// Analyze page - TODO: implement

export default function AnalyzePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Analyze Your Message</h1>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground">TODO: Implement analysis interface</p>
        <textarea
          className="w-full mt-4 min-h-[200px] p-4 border rounded-md"
          placeholder="Paste your message here to analyze..."
        />
      </div>
    </div>
  );
}