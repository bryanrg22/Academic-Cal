export function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-slate-700"></div>
          <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-slate-800"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-amber-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <p className="text-slate-400 text-sm tracking-wide">Loading your briefing...</p>
      </div>
    </div>
  );
}

export function EmptyState({ message = "No briefings yet" }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-xl text-slate-200 mb-2">{message}</h3>
        <p className="text-slate-500 text-sm">
          Claude will submit your first academic briefing soon. Check back later!
        </p>
      </div>
    </div>
  );
}

export function SectionSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl animate-shimmer"></div>
      ))}
    </div>
  );
}
