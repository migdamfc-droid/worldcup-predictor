"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mb-6 text-6xl">⚽🏆</div>
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            World Cup 2026
          </span>
          <br />
          Bracket Predictor
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-slate-400">
          Predict the groups, knockout rounds, and tournament winner. Compete with your friends on
          the leaderboard and prove you know football best.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/predict" className="btn-primary text-lg">
            Start Predicting
          </Link>
          <Link href="/leaderboard" className="btn-secondary text-lg">
            View Leaderboard
          </Link>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <div className="glass-card p-6 text-left">
            <div className="mb-3 text-3xl">📊</div>
            <h3 className="mb-2 font-bold">12 Groups</h3>
            <p className="text-sm text-slate-400">
              Predict the final standings for all 48 teams across 12 groups.
            </p>
          </div>
          <div className="glass-card p-6 text-left">
            <div className="mb-3 text-3xl">🏟️</div>
            <h3 className="mb-2 font-bold">Knockout Bracket</h3>
            <p className="text-sm text-slate-400">
              Pick winners from the Round of 32 all the way to the Final.
            </p>
          </div>
          <div className="glass-card p-6 text-left">
            <div className="mb-3 text-3xl">🏅</div>
            <h3 className="mb-2 font-bold">Leaderboard</h3>
            <p className="text-sm text-slate-400">
              Compete with friends and track your score as results come in.
            </p>
          </div>
        </div>

        <div className="mt-16 glass-card p-8">
          <h2 className="mb-6 text-2xl font-bold">Scoring System</h2>
          <div className="grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "All 4 group positions correct", pts: "+4", color: "text-emerald-400" },
              { label: "3 group positions correct", pts: "+3", color: "text-emerald-400" },
              { label: "2 group positions correct", pts: "+2", color: "text-emerald-400" },
              { label: "1 group position correct", pts: "+1", color: "text-emerald-400" },
              { label: "Correct knockout result", pts: "+3", color: "text-blue-400" },
              { label: "Tournament winner", pts: "+6", color: "text-amber-400" },
              { label: "Top scorer", pts: "+2", color: "text-pink-400" },
              { label: "Top assister", pts: "+2", color: "text-pink-400" },
              { label: "Best player", pts: "+3", color: "text-pink-400" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
              >
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
