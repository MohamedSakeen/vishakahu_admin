'use client';

import React, { useEffect, useState } from 'react';
import { supabase, StudentRegistration } from '../lib/supabase';
import { Users, Image as ImageIcon, Trash2, Download, Upload, RefreshCw, CheckCircle, AlertCircle, Lock, LogOut, KeyRound, ShieldAlert, Mail, Plus, Pin } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
interface GalleryImage {
  id: string;
  public_id: string;
  secure_url: string;
  category: string;
  created_at: string;
  is_pinned?: boolean;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'registrations' | 'gallery'>('registrations');

  // Registrations state
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [regLoading, setRegLoading] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Gallery state
  const [photos, setPhotos] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [uploadCategory, setUploadCategory] = useState<string>('dojo');
  const uploadCategoryRef = React.useRef(uploadCategory);
  useEffect(() => {
    uploadCategoryRef.current = uploadCategory;
  }, [uploadCategory]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check initial session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const savedPasscodeSession = localStorage.getItem('vishakahu_admin_session');
        if (savedPasscodeSession === 'true') {
          setIsAuthenticated(true);
          setAuthChecking(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (username.trim() === 'Vishakahu_academy' && password === 'vishakahukarateschool') {
      localStorage.setItem('vishakahu_admin_session', 'true');
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Invalid credentials. Please try again.');
    }
    setAuthLoading(false);
  };

  // Handle Logout
  const handleLogout = () => {
    if (!confirm('Are you sure you want to lock the admin panel?')) return;
    localStorage.removeItem('vishakahu_admin_session');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

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

  // Load gallery photos from Supabase DB
  async function fetchGalleryPhotos() {
    setGalleryLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Gallery fetch warning:", error.message);
      } else {
        setPhotos(data || []);
      }
    } catch (err) {
      console.error("Gallery fetch error:", err);
    } finally {
      setGalleryLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('gallery_categories')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        setCategories(data);
        if (data.length > 0 && (!uploadCategory || !data.find(c => c.name === uploadCategory))) {
          setUploadCategory(data[0].name);
        }
      }
    } catch (err) {
      console.error("Category fetch error", err);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
      fetchGalleryPhotos();
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Loading state during auth check
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#060305] flex items-[#center] justify-center text-white">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-xs uppercase tracking-widest font-mono">Verifying Security Session...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060305] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Kanji Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-serif opacity-[0.02] text-white select-none pointer-events-none">
          師
        </div>

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-800/40 text-red-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Lock size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-serif">
              Vishakahu <span className="text-amber-500">Admin</span>
            </h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">
              Restricted Access · Authorized Personnel Only
            </p>
          </div>

          {/* Error Message Alert */}
          {authError && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading || !username || !password}
              className="w-full py-3.5 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {authLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center pt-4 border-t border-slate-800/80">
            <span className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-mono">
              Protected by Vishakahu Security Guard
            </span>
          </div>
        </div>
      </div>
    );
  }

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

  // Handle successful upload from Cloudinary Widget
  async function handleCloudinaryUpload(result: any) {
    if (result.event === 'success') {
      const info = result.info;
      
      try {
        const { error } = await supabase.from('gallery_images').insert({
          public_id: info.public_id,
          secure_url: info.secure_url,
          category: uploadCategoryRef.current
        });

        if (error) {
          throw new Error(error.message);
        }

        setStatusMsg({
          type: 'success',
          text: `Successfully uploaded to ${uploadCategoryRef.current}!`
        });
        
        // Refresh gallery
        fetchGalleryPhotos();
      } catch (err) {
        setStatusMsg({ type: 'error', text: `Database error: ${String(err)}` });
      }
    }
  }

  // Delete photo from Supabase database
  async function handleDeletePhoto(id: string) {
    if (!confirm(`Are you sure you want to delete this photo from the gallery?`)) return;

    try {
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }

      setPhotos(prev => prev.filter(p => p.id !== id));
      setStatusMsg({ type: 'success', text: `Deleted photo successfully.` });
    } catch (err) {
      alert('Delete failed: ' + String(err));
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const cleanName = newCategoryName.trim().toLowerCase();
    
    try {
      const { error } = await supabase.from('gallery_categories').insert({ name: cleanName });
      if (error) throw new Error(error.message);
      
      setNewCategoryName('');
      setStatusMsg({ type: 'success', text: `Category '${cleanName}' added.` });
      fetchCategories();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Failed to add category: ${String(err)}` });
    }
  }

  async function handleDeleteCategory(categoryName: string) {
    if (!confirm(`Delete category '${categoryName}'? All images in this category will be marked as unlabeled.`)) return;
    
    try {
      // 1. Update existing images
      await supabase.from('gallery_images').update({ category: 'unlabeled' }).eq('category', categoryName);
      
      // 2. Delete category
      const { error } = await supabase.from('gallery_categories').delete().eq('name', categoryName);
      if (error) throw new Error(error.message);
      
      setStatusMsg({ type: 'success', text: `Category '${categoryName}' deleted.` });
      fetchCategories();
      fetchGalleryPhotos();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Failed to delete category: ${String(err)}` });
    }
  }

  async function handleChangePhotoCategory(id: string, newCategory: string) {
    try {
      const { error } = await supabase.from('gallery_images').update({ category: newCategory }).eq('id', id);
      if (error) throw new Error(error.message);
      
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, category: newCategory } : p));
      setStatusMsg({ type: 'success', text: `Photo category updated.` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Failed to update photo category: ${String(err)}` });
    }
  }

  async function handleTogglePin(id: string, currentStatus: boolean) {
    if (!currentStatus) {
      // Trying to pin - check limit
      const currentPins = photos.filter(p => p.is_pinned).length;
      if (currentPins >= 5) {
        setStatusMsg({ type: 'error', text: 'You can only pin up to 5 images. Please unpin one first.' });
        return;
      }
    }

    try {
      const { error } = await supabase.from('gallery_images').update({ is_pinned: !currentStatus }).eq('id', id);
      if (error) throw new Error(error.message);
      
      setStatusMsg({ type: 'success', text: `Photo ${!currentStatus ? 'pinned to top' : 'unpinned'}.` });
      fetchGalleryPhotos();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Failed to update pin status: ${String(err)}` });
    }
  }

  const filteredRegistrations = registrations.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  const filteredPhotos = galleryFilter === 'all' 
    ? photos 
    : photos.filter(p => p.category === galleryFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Image src="/icon1.png" alt="Vishakahu Admin Logo" width={48} height={48} className="object-contain" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Vishakahu Admin Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage student registrations & gallery media files
            </p>
          </div>
        </div>

        {/* Tab Navigation & Lock Action */}
        <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={handleLogout}
            title="Lock Admin Session"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 rounded-lg transition-colors"
          >
            <LogOut size={15} />
            Lock Admin
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
            {/* Category Management & Upload Toolbar */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Category Management */}
              <div className="flex-1 bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-white mb-4">Manage Categories</h3>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 w-full"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-1 disabled:opacity-50 shrink-0"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-sm">
                      <span className="text-slate-300">{cat.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat.name)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && <span className="text-xs text-slate-500">No categories found. Add one!</span>}
                </div>
              </div>

              {/* Upload Section */}
              <div className="flex-1 bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-white">Upload New Photo</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Photos will be uploaded directly to Cloudinary and synchronized with the database.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">To:</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 w-full"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      {categories.length === 0 && <option value="dojo">dojo</option>}
                    </select>
                  </div>
                  
                  <CldUploadWidget
                    key={uploadCategory}
                    uploadPreset="vishakahu_preset"
                    onSuccess={handleCloudinaryUpload}
                    options={{
                      folder: `vishakahu-gallery/${uploadCategory}`,
                      multiple: true,
                      resourceType: 'image'
                    }}
                  >
                    {({ open }) => (
                      <button
                        onClick={() => open()}
                        disabled={categories.length === 0}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm w-full sm:w-auto disabled:opacity-50"
                      >
                        <Upload size={16} />
                        Bulk Upload
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-white">Gallery Media ({filteredPhotos.length})</h3>
                  <select
                    value={galleryFilter}
                    onChange={(e) => setGalleryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="unlabeled">Unlabeled</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => { fetchGalleryPhotos(); fetchCategories(); }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw size={12} className={galleryLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {galleryLoading ? (
                <div className="p-12 text-center text-slate-400">Loading gallery photos...</div>
              ) : filteredPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredPhotos.map((p) => (
                    <div
                      key={p.id}
                      className="group relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col"
                    >
                      <div className="aspect-square relative overflow-hidden bg-slate-900">
                        <img
                          src={p.secure_url ? p.secure_url.replace('/upload/', '/upload/w_400,q_auto,f_auto/') : ''}
                          alt={p.public_id || 'gallery image'}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white/90 text-[10px] uppercase font-bold rounded">
                          {p.category || 'unlabeled'}
                        </div>
                      </div>

                      <div className="p-2 flex flex-col gap-2 border-t border-slate-800 bg-slate-950">
                        <select
                          value={p.category || 'unlabeled'}
                          onChange={(e) => handleChangePhotoCategory(p.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded px-1 py-1 w-full focus:outline-none focus:border-red-500"
                        >
                          <option value="unlabeled">Unlabeled</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={p.public_id || 'unknown'}>
                            {p.public_id ? p.public_id.split('/').pop() : 'unknown'}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleTogglePin(p.id, !!p.is_pinned)}
                              className={`p-1 rounded transition-colors ${p.is_pinned ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}`}
                              title={p.is_pinned ? "Unpin photo" : "Pin to top (Max 5)"}
                            >
                              <Pin size={12} className={p.is_pinned ? "fill-amber-400" : ""} />
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(p.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                              title="Delete photo"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  No gallery photos found matching this category.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
