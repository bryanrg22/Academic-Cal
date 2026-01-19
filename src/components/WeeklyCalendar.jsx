import { useState } from 'react';
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  parseISO,
  isSameDay,
  isSameMonth,
  isToday,
  isPast,
  addWeeks,
  addMonths,
  eachDayOfInterval,
} from 'date-fns';

const MAX_VISIBLE_ITEMS = 2;

const ENCOURAGING_MESSAGES = [
  "Clear day — catch up on readings!",
  "Free day — review past material",
  "Open day — get ahead on projects",
  "No deadlines — perfect for studying",
  "Breathing room — plan your week",
];

function getRandomMessage(dayIndex) {
  return ENCOURAGING_MESSAGES[dayIndex % ENCOURAGING_MESSAGES.length];
}

function getStatusColor(dueDate, status) {
  if (status === 'submitted' || status === 'graded') {
    return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
  }

  const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  if (isPast(date) && !isToday(date)) return 'bg-rose-500/20 border-rose-500/40 text-rose-400';
  if (isToday(date)) return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
  return 'bg-slate-700/50 border-slate-600/50 text-slate-300';
}

function CalendarItem({ item, type, onClick }) {
  const statusColor = getStatusColor(item.dueDate, item.status);
  const isTask = type === 'task';

  return (
    <button
      onClick={() => onClick(item, type)}
      className={`w-full text-left text-xs px-2 py-1.5 rounded-md border truncate ${statusColor} hover:opacity-80 hover:scale-[1.02] transition-all cursor-pointer`}
    >
      <div className="flex items-center gap-1.5">
        {isTask && (
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            item.priority === 1 ? 'bg-rose-500' :
            item.priority === 2 ? 'bg-amber-500' : 'bg-slate-500'
          }`} />
        )}
        {type === 'gradescope' && (
          <svg className="w-3 h-3 flex-shrink-0 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="truncate">{item.title || item.task || item.assignment}</span>
      </div>
      {item.course && (
        <div className="text-[10px] opacity-70 mt-0.5 truncate">{item.course}</div>
      )}
    </button>
  );
}

function ItemDetailModal({ item, type, onClose }) {
  if (!item) return null;

  const statusColor = getStatusColor(item.dueDate, item.status);
  const title = item.title || item.task || item.assignment;

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
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${statusColor}`}>
                {item.status === 'submitted' ? 'Submitted' :
                 item.status === 'graded' ? 'Graded' :
                 type === 'task' ? `P${item.priority || 3}` :
                 'Pending'}
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
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
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

          {type === 'task' && (
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Priority: {item.priority === 1 ? 'High' : item.priority === 2 ? 'Medium' : 'Low'}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open
            </a>
          )}
          <button
            onClick={onClose}
            className={`${item.url ? '' : 'flex-1'} px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ date, items, dayIndex, onItemClick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCurrentDay = isToday(date);
  const isPastDay = isPast(date) && !isCurrentDay;
  const totalItems = items.length;
  const hasOverflow = totalItems > MAX_VISIBLE_ITEMS;
  const visibleItems = isExpanded ? items : items.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = totalItems - MAX_VISIBLE_ITEMS;

  return (
    <div className={`flex flex-col min-h-[200px] ${isPastDay ? 'opacity-50' : ''}`}>
      {/* Day header */}
      <div className={`text-center py-2 border-b border-slate-700/50 ${
        isCurrentDay ? 'bg-amber-500/10' : ''
      }`}>
        <div className="text-xs text-slate-500 uppercase tracking-wider">
          {format(date, 'EEE')}
        </div>
        <div className={`text-lg font-medium ${
          isCurrentDay ? 'text-amber-400' : 'text-slate-300'
        }`}>
          {format(date, 'd')}
        </div>
        {isCurrentDay && (
          <div className="text-[10px] text-amber-500 font-medium">TODAY</div>
        )}
      </div>

      {/* Items container */}
      <div className="flex-1 p-2 space-y-1.5">
        {visibleItems.map((item, idx) => (
          <CalendarItem
            key={`${item.type}-${idx}`}
            item={item.data}
            type={item.type}
            onClick={onItemClick}
          />
        ))}

        {/* +X more button */}
        {hasOverflow && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-xs px-2 py-1.5 rounded-md border border-dashed border-slate-600 text-slate-400 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
          >
            +{hiddenCount} more
          </button>
        )}

        {/* Collapse button */}
        {hasOverflow && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full text-xs px-2 py-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
          >
            Show less
          </button>
        )}

        {/* Empty state */}
        {totalItems === 0 && (
          <div className="text-[11px] text-slate-600 text-center py-3 px-1 italic">
            {isPastDay ? 'No items' : getRandomMessage(dayIndex)}
          </div>
        )}
      </div>

      {/* Item count badge - clickable to expand */}
      {totalItems > 0 && (
        <div className="text-center py-1 border-t border-slate-700/30">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
              totalItems >= 4 ? 'bg-rose-500/20 text-rose-400' :
              totalItems >= 3 ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-700/50 text-slate-400'
            }`}
          >
            {totalItems} {totalItems === 1 ? 'item' : 'items'} {hasOverflow && (isExpanded ? '▲' : '▼')}
          </button>
        </div>
      )}
    </div>
  );
}

function MonthDayCell({ date, items, currentMonth, onDayClick }) {
  const isCurrentDay = isToday(date);
  const isPastDay = isPast(date) && !isCurrentDay;
  const isOtherMonth = !isSameMonth(date, currentMonth);
  const totalItems = items.length;

  // Color based on item count
  const getBusyColor = () => {
    if (totalItems >= 4) return 'bg-rose-500/30 hover:bg-rose-500/40';
    if (totalItems >= 3) return 'bg-amber-500/30 hover:bg-amber-500/40';
    if (totalItems >= 2) return 'bg-blue-500/20 hover:bg-blue-500/30';
    if (totalItems >= 1) return 'bg-slate-700/30 hover:bg-slate-700/50';
    return '';
  };

  return (
    <div
      className={`min-h-[60px] p-1 border-b border-r border-slate-700/30 ${
        isOtherMonth ? 'opacity-30' : ''
      } ${isPastDay && !isOtherMonth ? 'opacity-50' : ''}`}
    >
      <div className={`text-xs text-center mb-1 ${
        isCurrentDay
          ? 'w-6 h-6 mx-auto rounded-full bg-amber-500 text-slate-900 font-bold flex items-center justify-center'
          : 'text-slate-400'
      }`}>
        {format(date, 'd')}
      </div>

      {totalItems > 0 && (
        <div
          className={`text-[10px] text-center py-1 rounded ${getBusyColor()} cursor-pointer transition-colors`}
          onClick={() => onDayClick(date, items)}
        >
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </div>
      )}
    </div>
  );
}

function DayItemsModal({ date, items, onItemClick, onClose }) {
  if (!date || !items) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div>
            <h3 className="text-lg font-medium text-slate-100">
              {format(date, 'EEEE, MMMM d')}
            </h3>
            <p className="text-xs text-slate-500">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items list */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onItemClick(item.data, item.type);
                onClose();
              }}
              className="w-full text-left p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                  item.type === 'task' ? 'bg-amber-500/20 text-amber-400' :
                  item.type === 'assignment' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-violet-500/20 text-violet-400'
                }`}>
                  {item.type}
                </span>
                {item.data.course && (
                  <span className="text-[10px] text-slate-500">{item.data.course}</span>
                )}
              </div>
              <p className="text-sm text-slate-200">{item.data.title || item.data.task || item.data.assignment}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthView({ currentDate, getItemsForDate, onDayClick }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 6);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-700/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs text-slate-500 text-center py-2 font-medium uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="border-l border-slate-700/30">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7">
            {week.map((day, dayIdx) => (
              <MonthDayCell
                key={dayIdx}
                date={day}
                items={getItemsForDate(day)}
                currentMonth={currentDate}
                onDayClick={onDayClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyCalendar({ assignments = [], actionItems = [], gradescope = [] }) {
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDayItems, setSelectedDayItems] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const currentWeekDate = addWeeks(new Date(), weekOffset);
  const currentMonthDate = addMonths(new Date(), monthOffset);

  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 0 }); // Sunday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthYear = viewMode === 'week'
    ? format(weekStart, 'MMMM yyyy')
    : format(currentMonthDate, 'MMMM yyyy');
  const weekRange = `${format(days[0], 'MMM d')} - ${format(days[6], 'MMM d')}`;

  // Helper to normalize title for comparison
  const normalizeForCompare = (str) => {
    if (!str) return '';
    let normalized = str.toLowerCase().replace(/\s+/g, '');
    // Remove verb prefixes first
    normalized = normalized.replace(/^(complete|submit|finish|turnin|upload|handin|do|start|workon)/, '');
    // Normalize assignment type prefixes
    normalized = normalized.replace(/^(homework)(\d+)/, 'hw$2');
    normalized = normalized.replace(/^(problemset)(\d+)/, 'ps$2');
    return normalized;
  };

  // Combine all items and group by date (with deduplication)
  const getItemsForDate = (date) => {
    const items = [];
    const seen = new Set();

    // Add assignments first (they have more details like URL)
    assignments.forEach(a => {
      if (!a.dueDate) return;
      const dueDate = parseISO(a.dueDate);
      if (isSameDay(dueDate, date)) {
        const key = `${normalizeForCompare(a.title)}-${normalizeForCompare(a.course)}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({ type: 'assignment', data: a });
        }
      }
    });

    // Add action items only if not already in assignments
    actionItems.forEach(item => {
      if (!item.dueDate) return;
      const dueDate = parseISO(item.dueDate);
      if (isSameDay(dueDate, date)) {
        const key = `${normalizeForCompare(item.task)}-${normalizeForCompare(item.course)}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({ type: 'task', data: item });
        }
      }
    });

    // Add gradescope submissions (that aren't already added)
    gradescope.forEach(g => {
      if (!g.dueDate || g.status === 'graded') return;
      const dueDate = parseISO(g.dueDate);
      if (isSameDay(dueDate, date)) {
        const key = `${normalizeForCompare(g.assignment)}-${normalizeForCompare(g.course)}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({ type: 'gradescope', data: { ...g, title: g.assignment } });
        }
      }
    });

    return items;
  };

  const handleItemClick = (item, type) => {
    setSelectedItem(item);
    setSelectedType(type);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedType(null);
  };

  const handleDayClick = (date, items) => {
    setSelectedDate(date);
    setSelectedDayItems(items);
  };

  const handleCloseDayModal = () => {
    setSelectedDate(null);
    setSelectedDayItems(null);
  };

  const handlePrevious = () => {
    if (viewMode === 'week') {
      setWeekOffset(w => w - 1);
    } else {
      setMonthOffset(m => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setWeekOffset(w => w + 1);
    } else {
      setMonthOffset(m => m + 1);
    }
  };

  const handleToday = () => {
    setWeekOffset(0);
    setMonthOffset(0);
  };

  const isAtToday = viewMode === 'week' ? weekOffset === 0 : monthOffset === 0;

  return (
    <>
      <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
          <div>
            <h3 className="text-slate-200 font-medium">{monthYear}</h3>
            {viewMode === 'week' && (
              <p className="text-xs text-slate-500">{weekRange}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('week')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'week'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'month'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Month
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevious}
                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={viewMode === 'week' ? 'Previous week' : 'Previous month'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {!isAtToday && (
                <button
                  onClick={handleToday}
                  className="px-2 py-1 text-xs rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                >
                  Today
                </button>
              )}

              <button
                onClick={handleNext}
                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile scroll hint - only for week view */}
        {viewMode === 'week' && (
          <div className="sm:hidden px-4 py-1.5 text-xs text-slate-500 text-center border-b border-slate-700/30 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m-12 6h12m-12 6h8" />
            </svg>
            <span>Swipe to see full week</span>
          </div>
        )}

        {/* Week view */}
        {viewMode === 'week' && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 divide-x divide-slate-700/30 min-w-[700px]">
              {days.map((day, idx) => (
                <DayColumn
                  key={idx}
                  date={day}
                  dayIndex={idx}
                  items={getItemsForDate(day)}
                  onItemClick={handleItemClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Month view */}
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentMonthDate}
            getItemsForDate={getItemsForDate}
            onDayClick={handleDayClick}
          />
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-4 py-2 border-t border-slate-700/30 bg-slate-800/20">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Submitted</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          type={selectedType}
          onClose={handleCloseModal}
        />
      )}

      {/* Day Items Modal (for month view) */}
      {selectedDate && selectedDayItems && (
        <DayItemsModal
          date={selectedDate}
          items={selectedDayItems}
          onItemClick={handleItemClick}
          onClose={handleCloseDayModal}
        />
      )}
    </>
  );
}
