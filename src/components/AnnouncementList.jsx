import { useState } from 'react';
import { format, parseISO } from 'date-fns';

function AnnouncementItem({ announcement }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h5 className="text-slate-200 font-medium truncate group-hover:text-white transition-colors">
              {announcement.title}
            </h5>
            {announcement.date && (
              <p className="text-xs text-slate-500 mt-0.5">
                {format(parseISO(announcement.date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-3 pb-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">
              {announcement.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseSection({ course, announcements }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 overflow-hidden">
      {/* Course header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
            <span className="text-amber-400 text-xs font-bold">
              {course.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="text-left">
            <h4 className="text-slate-200 font-medium">{course}</h4>
            <p className="text-xs text-slate-500">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Announcements list */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-2">
          {announcements.map((announcement, idx) => (
            <AnnouncementItem key={idx} announcement={announcement} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnnouncementList({ announcements = [] }) {
  // Group announcements by course name
  const grouped = announcements.reduce((acc, announcement) => {
    const course = announcement.course || 'General';
    if (!acc[course]) acc[course] = [];
    acc[course].push(announcement);
    return acc;
  }, {});

  const courses = Object.keys(grouped).sort();

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No announcements</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course, idx) => (
        <div key={course} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}>
          <CourseSection course={course} announcements={grouped[course]} />
        </div>
      ))}
    </div>
  );
}
