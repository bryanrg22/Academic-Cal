import { useState } from 'react';
import { normalizeCourse } from '../lib/dateUtils';

export function DailySummary({ summary }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!summary || (!summary.overall && !summary.courses)) {
    return null;
  }

  const courses = summary.courses ? Object.entries(summary.courses) : [];

  return (
    <div className="mb-8 animate-fade-in-up">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-800/60 to-slate-800/30 border border-amber-500/20 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="text-left">
              <h2 className="font-[family-name:var(--font-display)] text-lg text-slate-100 font-medium">
                Daily Briefing
              </h2>
              <p className="text-xs text-slate-500">AI-generated summary</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Content */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-5 pb-5 space-y-4">
            {/* Overall Summary */}
            {summary.overall && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <p className="text-slate-300 leading-relaxed">
                  {summary.overall}
                </p>
              </div>
            )}

            {/* Per-Course Summaries */}
            {courses.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
                  By Course
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {courses.map(([course, text]) => (
                    <div
                      key={course}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-700 text-slate-300">
                          {normalizeCourse(course)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
