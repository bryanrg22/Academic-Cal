import { useState } from 'react';
import { Link } from 'react-router-dom';

// Extract JSON from Claude's response (handles full response with markdown)
function extractJson(text) {
  // Try to find JSON block in markdown code fence
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find a JSON object directly (starts with { and ends with })
  const jsonMatch = text.match(/\{[\s\S]*"date"[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Return as-is if no pattern matched
  return text.trim();
}

export function Submit() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedJson, setExtractedJson] = useState(null);

  const handleExtract = () => {
    try {
      const jsonStr = extractJson(input);
      const parsed = JSON.parse(jsonStr);
      setExtractedJson(parsed);
      setStatus({ type: 'info', message: `Found briefing for ${parsed.date}` });
    } catch (err) {
      setStatus({ type: 'error', message: `Could not parse JSON: ${err.message}` });
      setExtractedJson(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const jsonStr = extractJson(input);
      const parsed = JSON.parse(jsonStr);

      const response = await fetch(
        'https://submitbriefing-fxtu2qcmfq-uc.a.run.app',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'eduardo34R'
          },
          body: JSON.stringify(parsed)
        }
      );

      const result = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: result.message });
        setInput('');
        setExtractedJson(null);
      } else {
        setStatus({ type: 'error', message: result.error });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }

    setLoading(false);
  };

  const sampleJson = {
    date: new Date().toISOString().split('T')[0],
    actionItems: [],
    assignments: [],
    announcements: [],
    edPosts: [],
    gradescope: []
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none"></div>

      <div className="relative">
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-slate-100 font-medium tracking-tight">
                  Submit Briefing
                </h1>
                <p className="text-slate-500 mt-1">
                  Paste JSON from Claude for Chrome
                </p>
              </div>
              <Link
                to="/"
                className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Paste Claude's Response
              </label>
              <p className="text-slate-500 text-sm mb-3">
                Paste the entire response from Claude — the JSON will be extracted automatically.
              </p>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setExtractedJson(null);
                  setStatus(null);
                }}
                placeholder="Paste Claude's full response here (including the JSON block)..."
                className="w-full h-80 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
              />
            </div>

            {status && (
              <div className={`p-4 rounded-xl ${
                status.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : status.type === 'info'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {status.message}
              </div>
            )}

            {extractedJson && (
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <h4 className="text-slate-300 font-medium mb-2">Preview:</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>Date: <span className="text-slate-200">{extractedJson.date}</span></p>
                  <p>Action Items: <span className="text-slate-200">{extractedJson.actionItems?.length || 0}</span></p>
                  <p>Assignments: <span className="text-slate-200">{extractedJson.assignments?.length || 0}</span></p>
                  <p>Announcements: <span className="text-slate-200">{extractedJson.announcements?.length || 0}</span></p>
                  <p>Ed Posts: <span className="text-slate-200">{extractedJson.edPosts?.length || 0}</span></p>
                  <p>Gradescope: <span className="text-slate-200">{extractedJson.gradescope?.length || 0}</span></p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleExtract}
                disabled={!input.trim()}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-200 font-medium rounded-xl transition-colors"
              >
                Preview
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-medium rounded-xl transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h3 className="text-slate-200 font-medium mb-2">How to use:</h3>
            <ol className="text-slate-400 text-sm space-y-2 list-decimal list-inside">
              <li>Open Claude for Chrome on your course pages (Brightspace, Gradescope, Ed)</li>
              <li>Use the prompt from the README to generate a briefing</li>
              <li>Copy Claude's <strong className="text-slate-300">entire response</strong> (Cmd+A, Cmd+C)</li>
              <li>Paste it above — the JSON will be extracted automatically</li>
              <li>Click <strong className="text-slate-300">Preview</strong> to verify, then <strong className="text-slate-300">Submit</strong></li>
            </ol>
          </div>
        </main>
      </div>
    </div>
  );
}
