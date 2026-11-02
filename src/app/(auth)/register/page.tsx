// src/app/(auth)/register/page.tsx
// Register page - TODO: implement

export default function RegisterPage() {
  return (
    <div className="bg-card border rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input type="text" className="w-full p-2 border rounded-md" placeholder="Your Name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full p-2 border rounded-md" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full p-2 border rounded-md" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full py-2 bg-primary text-primary-foreground rounded-md">
          Create Account
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a>
      </p>
    </div>
  );
}