import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { formatActionDueDate, sortByUrgency } from '../lib/dateUtils';
import { useToast } from './Toast';
import { useCompletedTasks, getTaskId } from '../hooks/useCompletedTasks';
import { removePersonalTask } from './QuickAddTask';

const PRIORITY_CONFIG = {
  1: {
    label: 'High',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
    glow: 'shadow-rose-500/20'
  },
  2: {
    label: 'Medium',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-500/20'
  },
  3: {
    label: 'Low',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/40',
    text: 'text-slate-400',
    dot: 'bg-slate-500',
    glow: 'shadow-slate-500/20'
  }
};

function TaskDetailModal({ item, onClose, onComplete, isCompleted }) {
  if (!item) return null;

  const priority = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG[3];

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
              <span className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md ${priority.bg} ${priority.border} ${priority.text} border`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
                {priority.label} Priority
              </span>
              {item.course && item.course !== 'Personal' && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/50">
                  {item.course}
                </span>
              )}
              {item.isPersonal && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/40">
                  Personal
                </span>
              )}
            </div>
            <h3 className={`text-lg font-medium text-slate-100 ${isCompleted ? 'line-through opacity-60' : ''}`}>
              {item.task}
            </h3>
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

          {item.dueDate && (
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Time: {format(parseISO(item.dueDate), 'h:mm a')}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Status: {isCompleted ? 'Completed' : 'Pending'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              onComplete(item.task, !isCompleted);
              onClose();
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors ${
              isCompleted
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-emerald-500 text-slate-900 hover:bg-emerald-600'
            }`}
          >
            {isCompleted ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Mark Incomplete
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark Complete
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ item, index, onComplete, onDelete, onOpenDetail }) {
  const { isCompleted, toggleTask } = useCompletedTasks();
  const taskId = getTaskId(item);
  const isChecked = isCompleted(taskId);
  const priority = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG[3];

  const handleToggle = (e) => {
    e.stopPropagation();
    const newChecked = !isChecked;
    // Extract briefing date from item's due date (date portion only)
    const briefingDate = item.dueDate ? item.dueDate.split('T')[0] : null;
    const itemType = item.isPersonal ? 'personal' : 'actionItem';
    toggleTask(taskId, newChecked, briefingDate, itemType);
    if (onComplete) {
      onComplete(item.task, newChecked);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item);
    }
  };

  const handleClick = () => {
    if (onOpenDetail) {
      onOpenDetail(item);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 transition-all duration-300 hover:bg-slate-800/60 hover:border-slate-600/50 cursor-pointer ${isChecked ? 'opacity-50' : ''}`}
    >
      {/* Custom checkbox */}
      <button
        onClick={handleToggle}
        className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
          isChecked
            ? 'bg-amber-500 border-amber-500'
            : 'border-slate-600 hover:border-amber-500/50 group-hover:border-slate-500'
        }`}
      >
        {isChecked && (
          <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {/* Priority indicator */}
          <span className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md ${priority.bg} ${priority.border} ${priority.text} border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
            P{item.priority}
          </span>

          {/* Course badge - hide if personal task with "Personal" category to avoid duplicate */}
          {item.course && !(item.isPersonal && item.course === 'Personal') && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/50">
              {item.course}
            </span>
          )}

          {/* Personal task indicator */}
          {item.isPersonal && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/40">
              Personal
            </span>
          )}
        </div>

        <p className={`text-slate-200 transition-all duration-200 ${isChecked ? 'line-through text-slate-500' : ''}`}>
          {item.task}
        </p>

        {item.dueDate && (
          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Due {formatActionDueDate(item.dueDate)}
          </p>
        )}
      </div>

      {/* Delete button for personal tasks */}
      {item.isPersonal && (
        <button
          onClick={handleDelete}
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete task"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Priority glow effect on hover */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg ${priority.glow}`}></div>
    </div>
  );
}

export function ActionItems({ items = [], excludeUrgent = false, onTaskDeleted }) {
  const { addToast } = useToast();
  const { isCompleted, toggleTask } = useCompletedTasks();
  const [selectedItem, setSelectedItem] = useState(null);

  // Sort by urgency (due date) first, then by priority
  const sortedItems = sortByUrgency(items);

  const handleComplete = (taskName, completed) => {
    if (completed) {
      addToast(`"${taskName.substring(0, 30)}${taskName.length > 30 ? '...' : ''}" marked complete`, 'success');
    } else {
      addToast(`Task restored`, 'undo');
    }
  };

  const handleModalComplete = (taskName, completed) => {
    if (selectedItem) {
      const taskId = getTaskId(selectedItem);
      const briefingDate = selectedItem.dueDate ? selectedItem.dueDate.split('T')[0] : null;
      const itemType = selectedItem.isPersonal ? 'personal' : 'actionItem';
      toggleTask(taskId, completed, briefingDate, itemType);
      handleComplete(taskName, completed);
    }
  };

  const handleDelete = (item) => {
    if (item.isPersonal && item.id) {
      removePersonalTask(item.id);
      addToast(`Task deleted`, 'undo');
      if (onTaskDeleted) {
        onTaskDeleted();
      }
    }
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No action items for today</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sortedItems.map((item, idx) => (
          <div key={item.id || idx} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}>
            <ActionItem
              item={item}
              index={idx}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onOpenDetail={handleOpenDetail}
            />
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedItem && (
        <TaskDetailModal
          item={selectedItem}
          onClose={handleCloseDetail}
          onComplete={handleModalComplete}
          isCompleted={isCompleted(getTaskId(selectedItem))}
        />
      )}
    </>
  );
}
