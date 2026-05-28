'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Career } from '../data/careers';
import { analyzeComparison, COMPARISON_DIMENSIONS, BADGE_LABELS } from '../data/career-compare';

interface CareerCompareAssistantProps {
  careerIds: string[];
  userTraits?: any;
  className?: string;
}

export default function CareerCompareAssistant({ 
  careerIds, 
  userTraits, 
  className = "" 
}: CareerCompareAssistantProps) {
  const analysis = useMemo(() => analyzeComparison(careerIds, userTraits), [careerIds, userTraits]);

  if (!analysis) return null;

  const { results, sharedSkills, tradeoffs, decisionSummary, decisionStatus, confidence } = analysis;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Decision Status Header */}
      <div className="rounded-3xl border border-core-border bg-core-surface p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-1">Decision guidance</p>
            <h2 className="text-xl font-display font-semibold text-core-heading">
              {decisionStatus === 'explore' ? '🔍 Explore more paths' : 
               decisionStatus === 'strong' ? '✨ Strong recommendation' : 
               '⚖️ Strategic evaluation'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase text-core-muted font-mono">Profile Match</p>
              <p className="text-lg font-bold text-core-accent">{confidence}%</p>
            </div>
            <div className="h-12 w-px bg-core-border hidden sm:block" />
            <div className="flex -space-x-2">
              {results.map(r => (
                <div 
                  key={r.career.id} 
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-core-bg border-2 border-core-surface text-xl shadow-sm"
                  title={r.career.title}
                >
                  {r.career.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-core-text leading-relaxed max-w-3xl">
          {decisionSummary}
        </p>
      </div>

      {/* Desktop Comparison Table */}
      <div className="hidden lg:block overflow-hidden rounded-3xl border border-core-border bg-core-surface shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-core-border bg-core-bg/30">
              <th className="p-6 w-48 text-xs uppercase tracking-widest text-core-muted font-mono">Dimension</th>
              {results.map(r => (
                <th key={r.career.id} className="p-6 min-w-[200px]">
                  <div className="flex flex-col gap-2">
                    {r.badge && (
                      <span className={`inline-flex self-start px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.badge === 'match' ? 'bg-emerald-500/10 text-emerald-400' :
                        r.badge === 'overall' ? 'bg-purple-500/10 text-purple-400' :
                        r.badge === 'growth' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {BADGE_LABELS[r.badge]}
                      </span>
                    )}
                    <span className="text-2xl">{r.career.icon}</span>
                    <span className="font-display font-bold text-core-heading leading-tight">{r.career.title}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-core-border/50">
            {COMPARISON_DIMENSIONS.map(dim => (
              <tr key={dim.key} className="group hover:bg-white/[0.02] transition-colors">
                <td className="p-5 text-xs font-semibold text-core-muted/80">{dim.label}</td>
                {results.map(r => {
                  let val: any = r.career[dim.key as keyof Career] ?? '—';
                  if (dim.key === 'remote') val = r.remotePotential;
                  if (dim.key === 'momentum') val = r.marketMomentum;
                  if (dim.key === 'confidence') val = `${r.matchPercentage}%`;
                  
                  return (
                    <td key={`${r.career.id}-${dim.key}`} className="p-5 text-sm text-core-text">
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Pros/Cons Rows */}
            <tr className="bg-core-bg/20">
              <td className="p-5 text-xs font-semibold text-core-muted/80 align-top pt-8">Key Advantages</td>
              {results.map(r => (
                <td key={`${r.career.id}-pros`} className="p-5 align-top pt-8">
                  <ul className="space-y-2">
                    {r.pros.map((p, i) => (
                      <li key={i} className="text-xs text-emerald-400/90 flex gap-2">
                        <span className="shrink-0">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-5 text-xs font-semibold text-core-muted/80 align-top pt-6 pb-8">Primary Risks</td>
              {results.map(r => (
                <td key={`${r.career.id}-cons`} className="p-5 align-top pt-6 pb-8">
                  <ul className="space-y-2">
                    {r.cons.map((c, i) => (
                      <li key={i} className="text-xs text-amber-400/80 flex gap-2">
                        <span className="shrink-0">△</span> {c}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden">
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
          {results.map(r => (
            <div key={r.career.id} className="snap-center shrink-0 w-[85vw] max-w-[340px] rounded-3xl border border-core-border bg-core-surface p-6 flex flex-col h-full shadow-soft">
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{r.career.icon}</span>
                {r.badge && (
                  <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                    r.badge === 'match' ? 'bg-emerald-500/10 text-emerald-400' :
                    r.badge === 'overall' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {BADGE_LABELS[r.badge]}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-core-heading mb-1">{r.career.title}</h3>
              <p className="text-xs text-core-muted mb-6">{r.career.category}</p>
              
              <div className="space-y-4 flex-1">
                {COMPARISON_DIMENSIONS.slice(0, 6).map(dim => {
                   let val: any = r.career[dim.key as keyof Career] ?? '—';
                   if (dim.key === 'remote') val = r.remotePotential;
                   return (
                    <div key={dim.key} className="flex justify-between items-center border-b border-core-border/30 pb-2">
                      <span className="text-[10px] uppercase text-core-muted font-medium">{dim.label}</span>
                      <span className="text-xs text-core-text font-semibold">{val}</span>
                    </div>
                   );
                })}
                <div className="pt-2">
                   <p className="text-[10px] uppercase text-core-muted font-medium mb-2">Advantages</p>
                   <div className="flex flex-wrap gap-2">
                     {r.pros.slice(0, 2).map((p, i) => (
                       <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">{p}</span>
                     ))}
                   </div>
                </div>
              </div>

              <Link 
                href={`/careers/${r.career.id}`}
                className="mt-8 block w-full rounded-2xl bg-core-bg py-3 text-center text-sm font-semibold text-core-heading hover:text-core-accent transition-colors border border-core-border/50"
              >
                View Roadmap
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Tradeoffs & Intersection */}
      <div className="grid gap-6 md:grid-cols-2">
        {tradeoffs.length > 0 && (
          <div className="rounded-3xl border border-core-border bg-core-bg/40 p-6">
            <h3 className="text-sm font-semibold text-core-heading mb-4 flex items-center gap-2">
              <span>⚖️</span> Tradeoffs to consider
            </h3>
            <ul className="space-y-3">
              {tradeoffs.map((t, i) => (
                <li key={i} className="text-sm text-core-muted leading-relaxed flex gap-3">
                  <span className="text-core-accent mt-0.5">•</span> {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sharedSkills.length > 0 && (
          <div className="rounded-3xl border border-core-border bg-core-bg/40 p-6">
            <h3 className="text-sm font-semibold text-core-heading mb-4 flex items-center gap-2">
              <span>🔗</span> Skill overlap
            </h3>
            <p className="text-sm text-core-muted mb-4 leading-relaxed">
              Regardless of your choice, mastering these common areas provides leverage for all selected paths:
            </p>
            <div className="flex flex-wrap gap-2">
              {sharedSkills.map(skill => (
                <span key={skill} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-core-text">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          type="button" 
          onClick={() => window.print()}
          className="w-full sm:w-auto px-8 py-3 rounded-full border border-core-border text-sm font-semibold text-core-muted hover:text-core-heading transition"
        >
          Save comparison PDF
        </button>
        <Link 
          href="/careers"
          className="w-full sm:w-auto px-8 py-3 rounded-full bg-core-accent text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg text-center"
        >
          Explore more paths
        </Link>
      </div>
    </div>
  );
}