"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

function Countdown() {
  const target = new Date("2026-06-11T20:00:00Z");
  const [diff, setDiff] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (diff <= 0) return <p className="text-sm text-zinc-400">The tournament has started!</p>;

  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex justify-center gap-3 sm:gap-5">
      {[
        [days, "Days"],
        [hrs, "Hours"],
        [mins, "Min"],
        [secs, "Sec"],
      ].map(([val, label]) => (
        <div key={label as string} className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums sm:text-3xl">{String(val).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label as string}</span>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-zinc-400">
          FIFA World Cup 2026
        </p>
        <h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Bracket Predictor
        </h1>
        <p className="mx-auto mb-8 max-w-lg text-base text-slate-400">
          Predict group standings, knockout results, and individual awards.
          Compete with friends on a live leaderboard.
        </p>

        <div className="mb-10 glass-card inline-block px-8 py-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Predictions lock in</p>
          <Countdown />
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/predict" className="btn-primary">
            Start Predicting
          </Link>
          <Link href="/leaderboard" className="btn-secondary">
            Leaderboard
          </Link>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: "Group Stage",
              desc: "Rank all 48 teams across 12 groups to predict final standings.",
              icon: (
                <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
              ),
            },
            {
              title: "Knockout Bracket",
              desc: "Pick winners from the Round of 32 through to the Final.",
              icon: (
                <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              ),
            },
            {
              title: "Leaderboard",
              desc: "Track your score against friends as real results come in.",
              icon: (
                <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.04 6.04 0 01-2.77.853m0 0a6.04 6.04 0 01-2.77-.853" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.title} className="glass-card p-5 text-left">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
                {item.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold">{item.title}</h3>
              <p className="text-xs leading-relaxed text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 glass-card p-6">
          <h2 className="mb-5 text-lg font-semibold">Points System</h2>
          <div className="grid gap-px overflow-hidden rounded-lg bg-zinc-900 sm:grid-cols-3">
            {[
              { label: "Group — all 4 correct", pts: "4" },
              { label: "Group — 3 correct", pts: "3" },
              { label: "Group — 2 correct", pts: "2" },
              { label: "Group — 1 correct", pts: "1" },
              { label: "Knockout match winner", pts: "3" },
              { label: "Tournament winner", pts: "6" },
              { label: "Top scorer", pts: "2" },
              { label: "Top assister", pts: "2" },
              { label: "Best player", pts: "3" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-zinc-950 px-4 py-2.5"
              >
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className="text-xs font-semibold text-white">+{item.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
