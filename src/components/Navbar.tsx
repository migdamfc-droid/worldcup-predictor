"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();
        if (profile) setUsername(profile.username);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) setUsername(profile.username);
          });
      } else {
        setUsername("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/predict", label: "Predict" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/scores", label: "Scores" },
    { href: "/compare", label: "Compare" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <svg className="h-5 w-5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.97.633-3.794 1.708-5.282" />
          </svg>
          <span className="text-zinc-900 dark:text-white">WC 2026</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
          {user ? (
            <>
              <span className="text-sm text-zinc-500 dark:text-slate-400">{username}</span>
              <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-zinc-900 dark:text-slate-500 dark:hover:text-white">
                Log out
              </button>
            </>
          ) : (
            <Link href="/predict" className="btn-primary text-sm">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-2 dark:border-white/10 dark:bg-zinc-950">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === link.href
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-white"
          >
            {theme === "dark" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          {user ? (
            <div className="flex items-center justify-between rounded-lg px-3 py-2">
              <span className="text-sm text-zinc-500 dark:text-slate-400">{username}</span>
              <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-zinc-900 dark:text-slate-500 dark:hover:text-white">
                Log out
              </button>
            </div>
          ) : (
            <Link href="/predict" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 dark:text-white">
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
