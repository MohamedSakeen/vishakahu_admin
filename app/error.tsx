'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin portal error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <span className="text-rose-400 font-mono text-xs tracking-widest uppercase mb-2">Error Notice</span>
      <h1 className="text-2xl font-bold text-white mb-4">Admin Operation Interrupted</h1>
      <p className="text-slate-400 text-sm max-w-sm mb-6">
        An unexpected error occurred while processing admin data.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Retry Action
      </button>
    </div>
  );
}
