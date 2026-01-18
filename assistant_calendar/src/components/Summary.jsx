import { parseISO, isPast, isToday, differenceInDays } from 'date-fns';
import { useCompletedTasks, getTaskId } from '../hooks/useCompletedTasks';
import { normalizeCourse } from '../lib/dateUtils';

/**
 * Calculate summary stats from briefing data
 * @param {Function} isCompleted - Function to check if a task is completed
 */
function calculateStats(assignments, actionItems, gradescope, isCompleted) {
  const stats = {
    total: {
      assignments: assignments.length,
      overdue: 0,
      dueToday: 0,
      dueSoon: 0, // within 7 days
      submitted: 0,
      actionItems: actionItems.length,
      completedActions: 0,
      pendingTasks: 0
    },
    byCourse: {}
  };

  // Process assignments
  assignments.forEach(a => {
    const course = normalizeCourse(a.course);
    if (!stats.byCourse[course]) {
      stats.byCourse[course] = { assignments: 0, overdue: 0, dueToday: 0, dueSoon: 0, submitted: 0, actionItems: 0, completedActions: 0, graded: [] };
    }
    stats.byCourse[course].assignments++;

    if (a.status === 'submitted') {
      stats.total.submitted++;
      stats.byCourse[course].submitted++;
    } else if (a.dueDate) {
      const date = parseISO(a.dueDate);
      const daysUntil = differenceInDays(date, new Date());

      if (isPast(date) && !isToday(date)) {
        stats.total.overdue++;
        stats.byCourse[course].overdue++;
      } else if (isToday(date)) {
        stats.total.dueToday++;
        stats.byCourse[course].dueToday++;
      } else if (daysUntil <= 7) {
        stats.total.dueSoon++;
        stats.byCourse[course].dueSoon++;
      }
    }
  });

  // Process action items - check if they're completed
  actionItems.forEach(item => {
    const course = normalizeCourse(item.course);
    if (!stats.byCourse[course]) {
      stats.byCourse[course] = { assignments: 0, overdue: 0, dueToday: 0, dueSoon: 0, submitted: 0, actionItems: 0, completedActions: 0, graded: [] };
    }

    const taskId = getTaskId(item);
    const completed = isCompleted(taskId);

    if (completed) {
      stats.total.completedActions++;
      stats.byCourse[course].completedActions++;
    } else {
      stats.total.pendingTasks++;
      stats.byCourse[course].actionItems++;

      // Include uncompleted action items in due today/overdue counts
      if (item.dueDate) {
        const date = parseISO(item.dueDate);
        if (isPast(date) && !isToday(date)) {
          stats.total.overdue++;
          stats.byCourse[course].overdue++;
        } else if (isToday(date)) {
          stats.total.dueToday++;
          stats.byCourse[course].dueToday++;
        } else if (differenceInDays(date, new Date()) <= 7) {
          stats.total.dueSoon++;
          stats.byCourse[course].dueSoon++;
        }
      }
    }
  });

  // Process gradescope for recent grades
  gradescope.forEach(g => {
    const course = normalizeCourse(g.course);
    if (!stats.byCourse[course]) {
      stats.byCourse[course] = { assignments: 0, overdue: 0, dueToday: 0, dueSoon: 0, submitted: 0, actionItems: 0, completedActions: 0, graded: [] };
    }
    if (g.status === 'graded' && g.score) {
      stats.byCourse[course].graded.push({ name: g.assignment, score: g.score });
    }
  });

  return stats;
}

function StatBadge({ value, label, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-700/50 text-slate-300',
    danger: 'bg-rose-500/20 text-rose-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    success: 'bg-emerald-500/20 text-emerald-400',
    info: 'bg-blue-500/20 text-blue-400'
  };

  return (
    <div className={`px-3 py-2 rounded-lg ${variants[variant]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

function CourseCard({ course, data }) {
  const hasIssues = data.overdue > 0 || data.dueToday > 0;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      hasIssues
        ? 'bg-rose-500/5 border-rose-500/30'
        : 'bg-slate-800/40 border-slate-700/40'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-slate-200">{course}</h4>
        {hasIssues && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-500/20 text-rose-400">
            Needs attention
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {data.overdue > 0 && (
          <div className="flex items-center gap-2 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            {data.overdue} overdue
          </div>
        )}
        {data.dueToday > 0 && (
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            {data.dueToday} due today
          </div>
        )}
        {data.dueSoon > 0 && (
          <div className="flex items-center gap-2 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {data.dueSoon} due soon
          </div>
        )}
        {data.submitted > 0 && (
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {data.submitted} submitted
          </div>
        )}
        {data.actionItems > 0 && (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            {data.actionItems} {data.actionItems === 1 ? 'task' : 'tasks'}
          </div>
        )}
        {data.completedActions > 0 && (
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {data.completedActions} done
          </div>
        )}
      </div>

      {data.graded.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-xs text-slate-500 mb-1">Recent grades:</div>
          {data.graded.slice(0, 2).map((g, idx) => (
            <div key={idx} className="text-sm text-slate-400 flex justify-between">
              <span className="truncate mr-2">{g.name}</span>
              <span className="text-emerald-400 font-mono">{g.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Summary({ assignments = [], actionItems = [], gradescope = [] }) {
  const { isCompleted } = useCompletedTasks();
  const stats = calculateStats(assignments, actionItems, gradescope, isCompleted);
  const courses = Object.keys(stats.byCourse).sort();

  const pendingCount = stats.total.assignments - stats.total.submitted;

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50">
        <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Overview
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.total.overdue > 0 && (
            <StatBadge value={stats.total.overdue} label="Overdue" variant="danger" />
          )}
          {stats.total.dueToday > 0 && (
            <StatBadge value={stats.total.dueToday} label="Due Today" variant="warning" />
          )}
          {stats.total.dueSoon > 0 && (
            <StatBadge value={stats.total.dueSoon} label="Due Soon" variant="info" />
          )}
          {pendingCount > 0 && (
            <StatBadge value={pendingCount} label="Pending" variant="default" />
          )}
          {stats.total.submitted > 0 && (
            <StatBadge value={stats.total.submitted} label="Submitted" variant="success" />
          )}
          {stats.total.pendingTasks > 0 && (
            <StatBadge value={stats.total.pendingTasks} label="Tasks" variant="default" />
          )}
          {stats.total.completedActions > 0 && (
            <StatBadge value={stats.total.completedActions} label="Completed" variant="success" />
          )}
        </div>

        {stats.total.overdue === 0 && stats.total.dueToday === 0 && stats.total.pendingTasks === 0 && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            You're all caught up! All tasks completed.
          </div>
        )}
      </div>

      {/* Per-Course Summary */}
      {courses.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">By Course</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map(course => (
              <CourseCard key={course} course={course} data={stats.byCourse[course]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
