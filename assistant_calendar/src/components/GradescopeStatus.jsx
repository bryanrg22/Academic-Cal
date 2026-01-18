const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500'
  },
  graded: {
    label: 'Graded',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    dot: 'bg-blue-500'
  },
  pending: {
    label: 'Not Submitted',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500'
  },
  late: {
    label: 'Late',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    dot: 'bg-rose-500'
  },
  missing: {
    label: 'Missing',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    dot: 'bg-rose-500'
  }
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
}

export function GradescopeStatus({ items = [] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No Gradescope submissions</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/40">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800/60 border-b border-slate-700/40">
        <div className="col-span-5 text-xs font-medium text-slate-400 uppercase tracking-wider">
          Assignment
        </div>
        <div className="col-span-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
          Course
        </div>
        <div className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
          Status
        </div>
        <div className="col-span-2 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">
          Score
        </div>
      </div>

      {/* Table body */}
      <div className="divide-y divide-slate-700/30">
        {items.map((item, idx) => {
          const statusConfig = getStatusConfig(item.status);

          return (
            <div
              key={idx}
              className={`grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800/20 hover:bg-slate-800/40 transition-colors animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
            >
              <div className="col-span-5 text-sm text-slate-200 truncate">
                {item.assignment}
              </div>
              <div className="col-span-3">
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/50">
                  {item.course}
                </span>
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md ${statusConfig.bg} ${statusConfig.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                  {statusConfig.label}
                </span>
              </div>
              <div className="col-span-2 text-sm text-right">
                {item.score ? (
                  <span className="text-slate-200 font-mono">{item.score}</span>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
