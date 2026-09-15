"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { MapPin, Award, LogIn, LogOut, User, Shield, TrendingUp } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <header className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight">ZynBuddy</span>
            <span className="text-[10px] text-green-200 block -mt-1 font-medium">Find the best prices</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {session?.user ? (
            <>
              <Link
                href="/trending"
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trending</span>
              </Link>
              <Link
                href="/rewards"
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Rewards</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{session.user.name || "Profile"}</span>
              </Link>
              {role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors"
                >
                  <Shield className="h-4 w-4 text-yellow-300" />
                  <span className="hidden sm:inline text-yellow-100">Admin</span>
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-1.5 text-sm bg-white text-green-700 px-4 py-2 rounded-xl font-semibold hover:bg-green-50 transition-all shadow-lg shadow-green-900/20"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
