// src/middleware.ts
// Next.js middleware - TODO: implement

export default function middleware() {
  // TODO: auth protection, rate limiting
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};