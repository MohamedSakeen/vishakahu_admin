'use client';

import React, { useEffect, useState } from 'react';
import { supabase, StudentRegistration } from '../lib/supabase';
import { Users, Image as ImageIcon, Trash2, Download, Upload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface GalleryPhoto {
  name: string;
  url: string;
  thumbUrl: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'registrations' | 'gallery'>('registrations');

  // Registrations state
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [regLoading, setRegLoading] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Gallery state
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load registrations from Supabase DB
  async function fetchRegistrations() {
    setRegLoading(true);
    setRegError(null);
    try {
      const { data, error } = await supabase
        .from('student_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("DB fetch warning:", error.message);
        setRegError(error.message);
      } else {
        setRegistrations(data || []);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setRegError(err?.message || String(err));
    } finally {
      setRegLoading(false);
    }
  }

  // Load gallery photos from Supabase Storage
  async function fetchGalleryPhotos() {
    setGalleryLoading(true);
    const BUCKET = 'VishakaHu_Gallery';
    try {
      const { data: orgFiles } = await supabase.storage.from(BUCKET).list('orginl', { limit: 100 });
      const { data: rootFiles } = await supabase.storage.from(BUCKET).list('', { limit: 100 });

      const fileMap = new Map<string, GalleryPhoto>();

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vxqneiuxtzxrmlehrxgj.supabase.co';

      if (orgFiles && orgFiles.length > 0) {
        for (const file of orgFiles) {
          if (file.name.startsWith('.')) continue;
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          fileMap.set(file.name, {
            name: file.name,
            url: `${supabaseUrl}/storage/v1/object/public/${BUCKET}/orginl/${file.name}`,
            thumbUrl: `${supabaseUrl}/storage/v1/object/public/${BUCKET}/template/${baseName}.webp`
          });
        }
      }

      if (rootFiles && rootFiles.length > 0) {
        for (const file of rootFiles) {
          if (file.name.startsWith('.') || !file.name.includes('.')) continue;
          if (!fileMap.has(file.name)) {
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            fileMap.set(file.name, {
              name: file.name,
              url: `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${file.name}`,
              thumbUrl: `${supabaseUrl}/storage/v1/render/image/public/${BUCKET}/${file.name}?width=450&quality=75&format=webp`
            });
          }
        }
      }

      setPhotos(Array.from(fileMap.values()));
    } catch (err) {
      console.error("Gallery fetch error:", err);
    } finally {
      setGalleryLoading(false);
    }
  }

  useEffect(() => {
    fetchRegistrations();
    fetchGalleryPhotos();
  }, []);

  // Delete registration row
  async function handleDeleteRegistration(id: number) {
    if (!confirm('Are you sure you want to delete this student registration?')) return;
    try {
      const { error } = await supabase.from('student_registrations').delete().eq('id', id);
      if (error) {
        alert('Delete failed: ' + error.message);
      } else {
        setRegistrations(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert('Delete failed: ' + String(err));
    }
  }

  // Export registrations to CSV
  function exportCSV() {
    if (registrations.length === 0) return alert('No registrations to export.');
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Date Registered'];
    const rows = registrations.map(r => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.phone.replace(/"/g, '""')}"`,
      `"${new Date(r.created_at).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vishakahu_registrations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  // Upload image file to Supabase storage
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMsg(null);

    const BUCKET = 'VishakaHu_Gallery';
    const filename = file.name;
    const orgPath = `orginl/${filename}`;

    try {
      // Upload original file to orginl/
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(orgPath, file, {
        contentType: file.type,
        upsert: true
      });

      if (upErr) {
        setStatusMsg({ type: 'error', text: `Upload failed: ${upErr.message}` });
      } else {
        setStatusMsg({ type: 'success', text: `Successfully uploaded ${filename} to orginl/` });
        fetchGalleryPhotos();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Upload error: ${String(err)}` });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  // Delete photo from Supabase storage
  async function handleDeletePhoto(filename: string) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    const BUCKET = 'VishakaHu_Gallery';
    const baseName = filename.replace(/\.[^/.]+$/, "");

    try {
      await supabase.storage.from(BUCKET).remove([
        filename,
        `orginl/${filename}`,
        `template/${baseName}.webp`
      ]);

      setPhotos(prev => prev.filter(p => p.name !== filename));
      setStatusMsg({ type: 'success', text: `Deleted ${filename}` });
    } catch (err) {
      alert('Delete failed: ' + String(err));
    }
  }

  const filteredRegistrations = registrations.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Vishakahu Admin Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage student registrations & gallery media files
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'registrations'
                ? 'bg-red-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users size={16} />
            Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'gallery'
                ? 'bg-red-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon size={16} />
            Gallery ({photos.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto">
        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center justify-between text-sm ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* TAB 1: Student Registrations */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <input
                type="text"
                placeholder="Search student name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 w-full sm:w-80"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchRegistrations}
                  className="flex items-center gap-2 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                >
                  <RefreshCw size={14} className={regLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-4 py-2 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              {regLoading ? (
                <div className="p-12 text-center text-slate-400">Loading registrations...</div>
              ) : filteredRegistrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold">#</th>
                        <th className="px-6 py-4 font-semibold">Full Name</th>
                        <th className="px-6 py-4 font-semibold">Email Address</th>
                        <th className="px-6 py-4 font-semibold">Mobile Number</th>
                        <th className="px-6 py-4 font-semibold">Registered Date</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredRegistrations.map((r, idx) => (
                        <tr key={r.id || idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">{idx + 1}</td>
                          <td className="px-6 py-4 font-medium text-white">{r.name}</td>
                          <td className="px-6 py-4 text-slate-300">
                            <a href={`mailto:${r.email}`} className="hover:underline text-sky-400">{r.email}</a>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            <a href={`tel:${r.phone}`} className="hover:underline text-emerald-400">{r.phone}</a>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteRegistration(r.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete Registration"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : regError ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 text-amber-400 rounded-full mb-3">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-amber-300 font-medium text-sm">Supabase Database Notice</p>
                  <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">{regError}</p>
                  {regError.includes('student_registrations') && (
                    <p className="text-slate-500 text-xs mt-3 bg-slate-950/80 p-3 rounded border border-slate-800 font-mono inline-block text-left">
                      💡 Ensure table <span className="text-red-400">student_registrations</span> is created in Supabase SQL Editor:
                      <br/>
                      <span className="text-slate-400">CREATE TABLE student_registrations (id bigint primary key generated always as identity, name text, email text, phone text, created_at timestamptz default now());</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  No student registrations found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Gallery Management */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Upload Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
              <div>
                <h3 className="font-semibold text-white">Upload New Gallery Photo</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Uploaded photos are stored in <code className="text-red-400">orginl/</code> and automatically processed into WebP thumbnails.
                </p>
              </div>

              <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-lg cursor-pointer transition-colors font-medium text-sm">
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Select Photo to Upload'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Gallery Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">Gallery Media ({photos.length} Photos)</h3>
                <button
                  onClick={fetchGalleryPhotos}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw size={12} className={galleryLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {galleryLoading ? (
                <div className="p-12 text-center text-slate-400">Loading gallery photos...</div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {photos.map((p) => (
                    <div
                      key={p.name}
                      className="group relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col"
                    >
                      <div className="aspect-square relative overflow-hidden bg-slate-900">
                        <img
                          src={p.thumbUrl || p.url}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-950">
                        <span className="text-xs text-slate-400 truncate" title={p.name}>
                          {p.name}
                        </span>
                        <button
                          onClick={() => handleDeletePhoto(p.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  No gallery photos found in bucket.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
