import { format, parseISO, isPast, isToday } from 'date-fns';

function getStatusColor(dueDate, status) {
  if (status === 'submitted' || status === 'graded') {
    return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
  }

  if (!dueDate) return 'bg-slate-700/50 border-slate-600/50 text-slate-300';

  const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  if (isPast(date) && !isToday(date)) return 'bg-rose-500/20 border-rose-500/40 text-rose-400';
  if (isToday(date)) return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
  return 'bg-slate-700/50 border-slate-600/50 text-slate-300';
}

export function ItemDetailModal({ item, type, onClose }) {
  if (!item) return null;

  const statusColor = getStatusColor(item.dueDate, item.status);
  const title = item.title || item.task || item.assignment;

  const getStatusLabel = () => {
    if (item.status === 'submitted') return 'Submitted';
    if (item.status === 'graded') return 'Graded';
    if (type === 'task') return `Priority ${item.priority || 3}`;
    return 'Pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${statusColor}`}>
                {getStatusLabel()}
              </span>
              {item.course && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/50">
                  {item.course}
                </span>
              )}
            </div>
            <h3 className="text-lg font-medium text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors ml-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          {item.dueDate && (
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Due: {format(parseISO(item.dueDate), 'EEEE, MMMM d, yyyy')}</span>
            </div>
          )}

          {item.score && (
            <div className="flex items-center gap-2 text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Score: {item.score}</span>
            </div>
          )}

          {type === 'task' && item.priority && (
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Priority: {item.priority === 1 ? 'High' : item.priority === 2 ? 'Medium' : 'Low'}</span>
            </div>
          )}

          {/* Type indicator */}
          <div className="flex items-center gap-2 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="capitalize">{type}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Brightspace
            </a>
          )}
          <button
            onClick={onClose}
            className={`${item.url ? '' : 'flex-1'} px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
