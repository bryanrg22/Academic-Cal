import { useState } from 'react';
import { format, addDays } from 'date-fns';

const PERSONAL_TASKS_KEY = 'personalTasks';

export function getPersonalTasks() {
  try {
    const stored = localStorage.getItem(PERSONAL_TASKS_KEY);
    if (!stored) return [];
    const tasks = JSON.parse(stored);
    // Filter out tasks older than 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return tasks.filter(t => new Date(t.createdAt).getTime() > thirtyDaysAgo);
  } catch {
    return [];
  }
}

function savePersonalTasks(tasks) {
  localStorage.setItem(PERSONAL_TASKS_KEY, JSON.stringify(tasks));
}

export function addPersonalTask(task) {
  const tasks = getPersonalTasks();
  tasks.push({
    ...task,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  savePersonalTasks(tasks);
  return tasks;
}

export function removePersonalTask(taskId) {
  const tasks = getPersonalTasks().filter(t => t.id !== taskId);
  savePersonalTasks(tasks);
  return tasks;
}

export function QuickAddTask({ onTaskAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [priority, setPriority] = useState(2);
  const [course, setCourse] = useState('Personal');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.trim()) return;

    const newTask = {
      task: task.trim(),
      dueDate: dueDate + 'T23:59:00',
      priority,
      course,
      isPersonal: true,
    };

    addPersonalTask(newTask);
    setTask('');
    setIsOpen(false);

    if (onTaskAdded) {
      onTaskAdded(newTask);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-dashed border-slate-600 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-colors w-full justify-center"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-sm">Add personal task</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-200">Add Personal Task</h4>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <input
        type="text"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="What do you need to do?"
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
        autoFocus
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Category</label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500/50"
          >
            <option value="Personal">Personal</option>
            <option value="Study">Study</option>
            <option value="Office Hours">Office Hours</option>
            <option value="Group Project">Group Project</option>
            <option value="Review">Review</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">Priority</label>
        <div className="flex gap-2">
          {[
            { value: 1, label: 'High', color: 'bg-rose-500/20 border-rose-500/40 text-rose-400' },
            { value: 2, label: 'Medium', color: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
            { value: 3, label: 'Low', color: 'bg-slate-500/20 border-slate-500/40 text-slate-400' },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                priority === p.value ? p.color : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!task.trim()}
          className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-slate-900 text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Task
        </button>
      </div>
    </form>
  );
}
