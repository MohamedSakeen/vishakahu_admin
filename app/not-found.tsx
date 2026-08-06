import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <span className="text-red-400 font-mono text-xs tracking-widest uppercase mb-2">404 — Admin Portal</span>
      <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-sm mb-8">
        The requested admin resource or route does not exist.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700"
      >
        Return to Admin Dashboard
      </Link>
    </div>
  );
}
