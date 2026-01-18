import { useState } from 'react';
import { isToday, isPast, parseISO, differenceInDays } from 'date-fns';
import { formatDueDate, sortByUrgency } from '../lib/dateUtils';
import { ItemDetailModal } from './ItemDetailModal';

const COURSE_COLORS = {
  'CS101': { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400' },
  'CS102': { bg: 'bg-violet-500/15', border: 'border-violet-500/30', text: 'text-violet-400' },
  'MATH201': { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  'PHYS101': { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400' },
  'default': { bg: 'bg-slate-500/15', border: 'border-slate-500/30', text: 'text-slate-400' }
};

function getCourseColor(course) {
  return COURSE_COLORS[course] || COURSE_COLORS.default;
}

function getStatusConfig(dueDate, status) {
  if (status === 'submitted') {
    return {
      label: 'Submitted',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    };
  }

  if (!dueDate) {
    return {
      label: 'No due date',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-500',
      icon: null
    };
  }

  const date = parseISO(dueDate);
  const daysUntil = differenceInDays(date, new Date());

  if (isPast(date) && !isToday(date)) {
    return {
      label: 'Overdue',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
  }

  if (isToday(date)) {
    return {
      label: 'Due Today',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
  }

  return {
    label: daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`,
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    icon: null
  };
}

export function AssignmentCard({ assignment, onClick }) {
  const { title, course, dueDate, status, url } = assignment;
  const courseColor = getCourseColor(course);
  const statusConfig = getStatusConfig(dueDate, status);

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(assignment);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group block rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 transition-all duration-200 hover:bg-slate-800 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/50 cursor-pointer"
    >
      {/* Header with course badge and status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${courseColor.bg} ${courseColor.border} ${courseColor.text} border`}>
          {course}
        </span>
        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} border`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-slate-100 font-medium mb-2 group-hover:text-white transition-colors line-clamp-2">
        {title}
      </h4>

      {/* Due date */}
      {dueDate && (
        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDueDate(dueDate)}</span>
        </div>
      )}

      {/* Click for details indicator */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-slate-500 text-xs group-hover:text-amber-500 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>Click for details</span>
      </div>
    </div>
  );
}

export function AssignmentList({ assignments = [] }) {
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Sort by urgency (overdue first, then due today, then by date)
  const sortedAssignments = sortByUrgency(assignments);

  if (sortedAssignments.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No assignments due this week</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAssignments.map((assignment, idx) => (
          <div key={idx} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}>
            <AssignmentCard
              assignment={assignment}
              onClick={setSelectedAssignment}
            />
          </div>
        ))}
      </div>

      {selectedAssignment && (
        <ItemDetailModal
          item={selectedAssignment}
          type="assignment"
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </>
  );
}
