export function EdPostList({ posts = [] }) {
  // Sort: pinned first, then staff posts, then others
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isStaff && !b.isStaff) return -1;
    if (!a.isStaff && b.isStaff) return 1;
    return 0;
  });

  if (sortedPosts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No Ed Discussion posts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedPosts.map((post, idx) => (
        <div key={idx} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}>
          <EdPostItem post={post} />
        </div>
      ))}
    </div>
  );
}

function EdPostItem({ post }) {
  const { title, course, isStaff, isPinned, url } = post;

  const CardWrapper = url ? 'a' : 'div';
  const cardProps = url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <CardWrapper
      {...cardProps}
      className={`group flex items-start gap-3 p-4 rounded-xl transition-all duration-200 ${
        isPinned
          ? 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15'
          : isStaff
          ? 'bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/15'
          : 'bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/60'
      } ${url ? 'cursor-pointer' : ''}`}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          isPinned
            ? 'bg-amber-500/20'
            : isStaff
            ? 'bg-blue-500/20'
            : 'bg-slate-700/50'
        }`}
      >
        {isPinned ? (
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 4.995v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2h-2v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2H4a1 1 0 00-1 1v2.086a1 1 0 00.293.707l6.292 6.292a1 1 0 01.293.707v6.208a1 1 0 001 1h2a1 1 0 001-1v-6.208a1 1 0 01.293-.707l6.292-6.292a1 1 0 00.293-.707V5.995a1 1 0 00-1-1h-2.043z" />
          </svg>
        ) : isStaff ? (
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {isPinned && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Pinned
            </span>
          )}
          {isStaff && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Staff
            </span>
          )}
          {course && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-700/50 text-slate-400 border border-slate-600/50">
              {course}
            </span>
          )}
        </div>

        <h4 className={`font-medium transition-colors line-clamp-2 ${
          isPinned
            ? 'text-amber-200 group-hover:text-amber-100'
            : isStaff
            ? 'text-blue-200 group-hover:text-blue-100'
            : 'text-slate-200 group-hover:text-white'
        }`}>
          {title}
        </h4>
      </div>

      {/* Arrow */}
      {url && (
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
            isPinned
              ? 'text-amber-500'
              : isStaff
              ? 'text-blue-500'
              : 'text-slate-500'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </CardWrapper>
  );
}
