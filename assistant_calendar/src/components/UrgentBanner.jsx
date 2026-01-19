import { format, isToday, isPast, parseISO } from 'date-fns';

export function UrgentBanner({ assignments = [], actionItems = [] }) {
  // Helper to normalize title for comparison
  const normalizeForCompare = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/\s+/g, '').replace(/^(hw|homework|lab|quiz|ps)/i, m => m.toLowerCase());
  };

  // Find overdue and due-today items (with deduplication)
  const urgentItems = [];
  const seen = new Set();

  // Add assignments first (they have more details like URL)
  assignments.forEach(a => {
    if (!a.dueDate || a.status === 'submitted') return;
    const dueDate = parseISO(a.dueDate);
    const key = `${normalizeForCompare(a.title)}-${normalizeForCompare(a.course)}`;

    if (isPast(dueDate) && !isToday(dueDate)) {
      if (!seen.has(key)) {
        seen.add(key);
        urgentItems.push({ ...a, urgency: 'overdue', type: 'assignment' });
      }
    } else if (isToday(dueDate)) {
      if (!seen.has(key)) {
        seen.add(key);
        urgentItems.push({ ...a, urgency: 'today', type: 'assignment' });
      }
    }
  });

  // Add action items only if not already in assignments
  actionItems.forEach(item => {
    if (!item.dueDate) return;
    const dueDate = parseISO(item.dueDate);
    const key = `${normalizeForCompare(item.task)}-${normalizeForCompare(item.course)}`;

    if (isPast(dueDate) && !isToday(dueDate)) {
      if (!seen.has(key)) {
        seen.add(key);
        urgentItems.push({ ...item, urgency: 'overdue', type: 'action' });
      }
    } else if (isToday(dueDate)) {
      if (!seen.has(key)) {
        seen.add(key);
        urgentItems.push({ ...item, urgency: 'today', type: 'action' });
      }
    }
  });

  // Sort: overdue first, then today
  urgentItems.sort((a, b) => {
    if (a.urgency === 'overdue' && b.urgency !== 'overdue') return -1;
    if (a.urgency !== 'overdue' && b.urgency === 'overdue') return 1;
    return 0;
  });

  if (urgentItems.length === 0) return null;

  const overdueCount = urgentItems.filter(i => i.urgency === 'overdue').length;
  const todayCount = urgentItems.filter(i => i.urgency === 'today').length;

  return (
    <div className="animate-fade-in-up">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-rose-950/80 border border-rose-800/50 p-4 animate-pulse-glow">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(244, 63, 94, 0.1) 10px,
              rgba(244, 63, 94, 0.1) 20px
            )`
          }}></div>
        </div>

        <div className="relative flex items-start gap-4">
          {/* Alert icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-rose-200 font-semibold">Attention Required</h3>
              <div className="flex gap-2">
                {overdueCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/30">
                    {overdueCount} overdue
                  </span>
                )}
                {todayCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/30 text-yellow-300 border border-yellow-500/30">
                    {todayCount} due today
                  </span>
                )}
              </div>
            </div>

            <ul className="space-y-1.5">
              {urgentItems.slice(0, 4).map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    item.urgency === 'overdue' ? 'bg-rose-400' : 'bg-yellow-400'
                  }`}></span>
                  <span className="text-slate-300 truncate">
                    {item.type === 'assignment' ? item.title : item.task}
                  </span>
                  <span className="text-slate-500 text-xs flex-shrink-0">
                    {item.course}
                  </span>
                  {item.urgency === 'overdue' && item.dueDate && (
                    <span className="text-rose-400 text-xs flex-shrink-0">
                      was due {format(parseISO(item.dueDate), 'MMM d')}
                    </span>
                  )}
                </li>
              ))}
              {urgentItems.length > 4 && (
                <li className="text-slate-500 text-xs pl-3.5">
                  +{urgentItems.length - 4} more items
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
