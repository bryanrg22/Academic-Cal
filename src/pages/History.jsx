import { Link, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useBriefing, useBriefingHistory } from '../hooks/useBriefing';
import { LoadingState, EmptyState } from '../components/LoadingState';
import { UrgentBanner } from '../components/UrgentBanner';
import { ActionItems } from '../components/ActionItems';
import { AssignmentList } from '../components/AssignmentCard';
import { AnnouncementList } from '../components/AnnouncementList';
import { EdPostList } from '../components/EdPostList';
import { GradescopeStatus } from '../components/GradescopeStatus';

function SectionHeader({ title, icon, count }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-lg text-slate-100 font-medium">
          {title}
        </h2>
      </div>
      {count !== undefined && (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
          {count}
        </span>
      )}
    </div>
  );
}

function Section({ children, className = '' }) {
  return (
    <section className={`mb-10 ${className}`}>
      {children}
    </section>
  );
}

export function History() {
  const { date } = useParams();

  if (date) {
    return <HistoryDetail date={date} />;
  }

  return <HistoryList />;
}

function HistoryList() {
  const { briefings, loading, error } = useBriefingHistory();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl text-slate-200 font-medium mb-2">Unable to load history</h2>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none"></div>

      <div className="relative">
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="animate-fade-in-up">
                <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-slate-100 font-medium tracking-tight">
                  Briefing History
                </h1>
                <p className="text-slate-500 mt-1">
                  View past academic briefings
                </p>
              </div>

              <nav className="flex items-center gap-2 animate-fade-in-up stagger-2">
                <Link
                  to="/"
                  className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Today
                </Link>
                <span className="px-3 py-2 text-sm font-medium text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  History
                </span>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {briefings.length === 0 ? (
            <EmptyState message="No briefing history" />
          ) : (
            <div className="space-y-3">
              {briefings.map((briefing, idx) => (
                <Link
                  key={briefing.id}
                  to={`/history/${briefing.date}`}
                  className={`group block p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all duration-200 animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                        <span className="text-amber-400 text-sm font-bold">
                          {format(parseISO(briefing.date), 'd')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-slate-200 font-medium group-hover:text-white transition-colors">
                          {format(parseISO(briefing.date), 'EEEE, MMMM d, yyyy')}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {briefing.actionItems?.length > 0 && (
                            <span>{briefing.actionItems.length} {briefing.actionItems.length === 1 ? 'action' : 'actions'}</span>
                          )}
                          {briefing.assignments?.length > 0 && (
                            <span>{briefing.assignments.length} {briefing.assignments.length === 1 ? 'assignment' : 'assignments'}</span>
                          )}
                          {briefing.announcements?.length > 0 && (
                            <span>{briefing.announcements.length} {briefing.announcements.length === 1 ? 'announcement' : 'announcements'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function HistoryDetail({ date }) {
  const { briefing, loading, error } = useBriefing(date);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !briefing) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              to="/history"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to History
            </Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState message={`No briefing found for ${date}`} />
        </main>
      </div>
    );
  }

  const {
    actionItems = [],
    assignments = [],
    announcements = [],
    edPosts = [],
    gradescope = []
  } = briefing;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none"></div>
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative">
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              to="/history"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to History
            </Link>
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-slate-100 font-medium tracking-tight">
              {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
            </h1>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Urgent Banner */}
          <Section>
            <UrgentBanner assignments={assignments} actionItems={actionItems} />
          </Section>

          {/* Action Items */}
          {actionItems.length > 0 && (
            <Section>
              <SectionHeader
                title="Action Items"
                count={actionItems.length}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              />
              <ActionItems items={actionItems} />
            </Section>
          )}

          {/* Assignments */}
          {assignments.length > 0 && (
            <Section>
              <SectionHeader
                title="Assignments"
                count={assignments.length}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <AssignmentList assignments={assignments} />
            </Section>
          )}

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {announcements.length > 0 && (
              <Section className="mb-0">
                <SectionHeader
                  title="Announcements"
                  count={announcements.length}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  }
                />
                <AnnouncementList announcements={announcements} />
              </Section>
            )}

            {edPosts.length > 0 && (
              <Section className="mb-0">
                <SectionHeader
                  title="Ed Discussion"
                  count={edPosts.length}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  }
                />
                <EdPostList posts={edPosts} />
              </Section>
            )}
          </div>

          {/* Gradescope */}
          {gradescope.length > 0 && (
            <Section>
              <SectionHeader
                title="Gradescope"
                count={gradescope.length}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
              <GradescopeStatus items={gradescope} />
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}
