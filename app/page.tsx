'use client';
import React, { useEffect, useState, useRef } from 'react';
import type { StudentRegistration } from '../lib/supabase';
import { Users, Image as ImageIcon, Trash2, Download, Upload, RefreshCw, CheckCircle, AlertCircle, Lock, LogOut, ShieldAlert, Plus, Pin, X, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';

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
  const [showPassword, setShowPassword] = useState(false);
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
  const uploadCategoryRef = useRef(uploadCategory);
  useEffect(() => {
    uploadCategoryRef.current = uploadCategory;
  }, [uploadCategory]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // In-app alert / confirm dialog popup state
  const [modalDialog, setModalDialog] = useState<{
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const showConfirm = ({
    title = 'Confirmation',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    onConfirm,
  }: {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setModalDialog({
      type: 'confirm',
      title,
      message,
      confirmLabel,
      cancelLabel,
      isDestructive,
      onConfirm: () => {
        setModalDialog(null);
        onConfirm();
      },
      onCancel: () => setModalDialog(null),
    });
  };

  const showAlert = ({
    title = 'Notice',
    message,
    buttonLabel = 'OK',
  }: {
    title?: string;
    message: string;
    buttonLabel?: string;
  }) => {
    setModalDialog({
      type: 'alert',
      title,
      message,
      confirmLabel: buttonLabel,
      onConfirm: () => setModalDialog(null),
    });
  };

  // Gallery action sheet state
  const [actionSheetPhoto, setActionSheetPhoto] = useState<GalleryImage | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalDialog) {
          if (modalDialog.onCancel) modalDialog.onCancel();
          setModalDialog(null);
        } else if (actionSheetPhoto) {
          setActionSheetPhoto(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalDialog, actionSheetPhoto]);

  // Auto-dismiss status messages
  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Check initial session on mount via secure server route
  useEffect(() => {
    async function checkAuth() {
      try {
        // Purge legacy insecure client-side session key if present
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vishakahu_admin_session');
        }

        const res = await fetch('/api/auth/check');
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Server auth check error:", err);
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // Handle Login via Secure Server Route
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setAuthError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setAuthError('Unable to connect to authentication server.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout via Secure Server Route
  const handleLogout = () => {
    showConfirm({
      title: 'Lock Admin Panel',
      message: 'Are you sure you want to lock the admin panel? You will need your password to log back in.',
      confirmLabel: 'Lock',
      cancelLabel: 'Cancel',
      isDestructive: false,
      onConfirm: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
          console.error("Logout error:", err);
        } finally {
          setIsAuthenticated(false);
          setUsername('');
          setPassword('');
        }
      },
    });
  };

  // Load registrations via secure server route
  async function fetchRegistrations() {
    setRegLoading(true);
    setRegError(null);
    try {
      const res = await fetch(`/api/admin/registrations?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data) {
        setRegistrations(json.data);
      } else {
        setRegError(json.error || 'Failed to load registrations.');
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setRegError(err?.message || String(err));
    } finally {
      setRegLoading(false);
    }
  }

  // Load gallery photos via secure server route
  async function fetchGalleryPhotos() {
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/admin/gallery?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data) {
        setPhotos(json.data);
      }
    } catch (err) {
      console.error("Gallery fetch error:", err);
    } finally {
      setGalleryLoading(false);
    }
  }

  // Load categories via secure server route
  async function fetchCategories() {
    try {
      const res = await fetch(`/api/admin/categories?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data) {
        setCategories(json.data);
        if (json.data.length > 0 && (!uploadCategory || !json.data.find((c: any) => c.name === uploadCategory))) {
          setUploadCategory(json.data[0].name);
        }
      }
    } catch (err) {
      console.error("Category fetch error", err);
    }
  }

  // Initial load on authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
      fetchGalleryPhotos();
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Real-time synchronization: Auto-refresh when tab gains focus & periodic polling
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh immediately when returning to tab from enrollment / other pages
    const handleFocus = () => {
      fetchRegistrations();
      fetchGalleryPhotos();
    };

    window.addEventListener('focus', handleFocus);

    // Live background polling every 10 seconds to catch new student registrations
    const pollInterval = setInterval(() => {
      fetchRegistrations();
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]);

  // Loading state during auth check
  if (authChecking) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-neutral-500 text-xs uppercase tracking-widest">Verifying Session...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center mx-auto mb-4">
              <Lock size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Vishakahu Admin
            </h1>
            <p className="text-neutral-500 text-xs mt-1.5">
              Restricted Access
            </p>
          </div>

          {/* Error Message Alert */}
          {authError && (
            <div className="mb-5 p-3 rounded-lg bg-neutral-800 border border-neutral-600 text-neutral-300 text-xs flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0 text-neutral-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 pr-11 text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading || !username || !password}
              className="w-full min-h-[48px] bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
            >
              {authLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center pt-4 border-t border-neutral-800">
            <span className="text-[0.6rem] text-neutral-600 uppercase tracking-widest">
              Vishakahu Security
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Delete registration row via secure server route
  async function handleDeleteRegistration(id: number) {
    showConfirm({
      title: 'Delete Student Registration',
      message: 'Are you sure you want to delete this student registration record? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/registrations?id=${id}`, { method: 'DELETE' });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.success) {
            setRegistrations(prev => prev.filter(r => r.id !== id));
            setStatusMsg({ type: 'success', text: 'Student registration deleted.' });
          } else {
            showAlert({
              title: 'Delete Failed',
              message: json.error || 'Failed to delete registration record.',
            });
            setStatusMsg({ type: 'error', text: `Delete failed: ${json.error || 'Failed to delete'}` });
          }
        } catch (err: any) {
          showAlert({
            title: 'Delete Failed',
            message: String(err?.message || err),
          });
          setStatusMsg({ type: 'error', text: `Delete failed: ${String(err?.message || err)}` });
        }
      },
    });
  }

  // Export registrations to CSV with formula injection defense
  function exportCSV() {
    if (registrations.length === 0) {
      showAlert({
        title: 'Export Registrations',
        message: 'There are no student registrations available to export.',
      });
      return;
    }

    // Sanitize cell values against spreadsheet formula injection (=, +, -, @)
    const sanitizeCsvCell = (val: unknown) => {
      const str = String(val ?? '');
      const escaped = str.replace(/"/g, '""');
      if (/^[=\+\-@\t\r]/.test(escaped)) {
        return `"'${escaped}"`;
      }
      return `"${escaped}"`;
    };

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Date Registered'];
    const rows = registrations.map(r => [
      r.id,
      sanitizeCsvCell(r.name),
      sanitizeCsvCell(r.email),
      sanitizeCsvCell(r.phone),
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

  // Handle successful upload from Cloudinary Widget via secure server route
  async function handleCloudinaryUpload(result: any) {
    try {
      console.log('[Cloudinary Widget Event]:', result);
      // In next-cloudinary, result may be { event: 'success', info: { ... } } or info directly
      const info = (result && typeof result === 'object' && result.info && typeof result.info === 'object')
        ? result.info
        : (result && typeof result === 'object' ? result : null);

      const public_id = info?.public_id;
      const secure_url = info?.secure_url || info?.url;

      if (!public_id || !secure_url) {
        // Event might be a non-upload lifecycle event (e.g. queue start/close)
        if (result?.event && result.event !== 'success') {
          return;
        }
        console.warn('[Cloudinary Widget] Missing public_id or secure_url in upload result:', result);
        return;
      }

      const targetCategory = uploadCategoryRef.current || 'dojo';

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_id,
          secure_url,
          category: targetCategory,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to save image to database.');
      }

      setStatusMsg({
        type: 'success',
        text: `Uploaded photo to '${targetCategory}' successfully!`,
      });

      // Optimistically append the new photo to state immediately so it displays instantly
      if (json.data) {
        setPhotos(prev => [json.data, ...prev.filter(p => p.id !== json.data.id)]);
      }

      // If current filter is hiding the newly uploaded category, switch filter to show it
      if (galleryFilter !== 'all' && galleryFilter !== targetCategory) {
        setGalleryFilter(targetCategory);
      }

      // Sync full list from server
      fetchGalleryPhotos();
    } catch (err: any) {
      console.error('[Cloudinary Upload Error]:', err);
      setStatusMsg({ type: 'error', text: `Upload save error: ${err?.message || String(err)}` });
    }
  }

  // Delete photo via secure server route
  async function handleDeletePhoto(id: string) {
    showConfirm({
      title: 'Delete Photo',
      message: 'Are you sure you want to delete this photo from the gallery? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
          const json = await res.json().catch(() => ({}));

          if (!res.ok || json.error) {
            throw new Error(json.error || 'Failed to delete image.');
          }

          setPhotos(prev => prev.filter(p => p.id !== id));
          setStatusMsg({ type: 'success', text: `Deleted photo successfully.` });
          setActionSheetPhoto(null);
        } catch (err: any) {
          showAlert({
            title: 'Delete Failed',
            message: 'Delete failed: ' + (err?.message || String(err)),
          });
          setStatusMsg({ type: 'error', text: `Delete failed: ${err?.message || String(err)}` });
        }
      },
    });
  }

  // Add new category via secure server route
  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const cleanName = newCategoryName.trim().toLowerCase();
    
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to add category.');
      }
      
      setNewCategoryName('');
      setStatusMsg({ type: 'success', text: `Category '${cleanName}' added.` });
      fetchCategories();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Failed to add category: ${err?.message || String(err)}` });
    }
  }

  // Delete category via secure server route
  async function handleDeleteCategory(categoryName: string) {
    showConfirm({
      title: 'Delete Category',
      message: `Delete category '${categoryName}'? All images in this category will be marked as unlabeled.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/categories?name=${encodeURIComponent(categoryName)}`, {
            method: 'DELETE',
          });
          const json = await res.json().catch(() => ({}));

          if (!res.ok || json.error) {
            throw new Error(json.error || 'Failed to delete category.');
          }
          
          setStatusMsg({ type: 'success', text: `Category '${categoryName}' deleted.` });
          fetchCategories();
          fetchGalleryPhotos();
        } catch (err: any) {
          setStatusMsg({ type: 'error', text: `Failed to delete category: ${err?.message || String(err)}` });
        }
      },
    });
  }

  // Update photo category via secure server route
  async function handleChangePhotoCategory(id: string, newCategory: string) {
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category: newCategory }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to update photo category.');
      }
      
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, category: newCategory } : p));
      setStatusMsg({ type: 'success', text: `Photo category updated.` });
      setActionSheetPhoto(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Failed to update photo category: ${err?.message || String(err)}` });
    }
  }

  // Toggle pin status via secure server route
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
      const res = await fetch('/api/admin/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_pinned: !currentStatus }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to update pin status.');
      }
      
      setStatusMsg({ type: 'success', text: `Photo ${!currentStatus ? 'pinned to top' : 'unpinned'}.` });
      setActionSheetPhoto(null);
      fetchGalleryPhotos();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Failed to update pin status: ${err?.message || String(err)}` });
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">

      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top row: Title + Lock */}
          <div className="flex items-center justify-between h-14">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Vishakahu Admin
            </h1>
            <button
              onClick={handleLogout}
              title="Lock Admin Session"
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors active:scale-95"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 pb-2">
            <button
              onClick={() => setActiveTab('registrations')}
              className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg transition-all active:scale-[0.98] ${
                activeTab === 'registrations'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800'
              }`}
            >
              <Users size={16} />
              Students ({registrations.length})
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg transition-all active:scale-[0.98] ${
                activeTab === 'gallery'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800'
              }`}
            >
              <ImageIcon size={16} />
              Gallery ({photos.length})
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center justify-between text-sm border-l-4 ${
              statusMsg.type === 'success'
                ? 'bg-neutral-900 border-l-white text-neutral-200'
                : 'bg-neutral-900 border-l-neutral-500 text-neutral-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="text-xs sm:text-sm">{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-neutral-500 hover:text-white p-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ─── TAB 1: Student Registrations ─── */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="text"
                placeholder="Search name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchRegistrations}
                  className="flex items-center gap-2 min-h-[44px] px-4 py-2 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors border border-neutral-800 active:scale-95"
                >
                  <RefreshCw size={14} className={regLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 min-h-[44px] px-4 py-2 text-xs bg-white hover:bg-neutral-200 text-black rounded-lg transition-colors font-medium active:scale-95"
                >
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>

            {/* Registrations Content */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {regLoading ? (
                <div className="p-12 text-center text-neutral-500">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Loading registrations...
                </div>
              ) : filteredRegistrations.length > 0 ? (
                <>
                  {/* Desktop Table (hidden on mobile) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-300">
                      <thead className="bg-neutral-950 text-neutral-500 text-xs uppercase border-b border-neutral-800">
                        <tr>
                          <th className="px-5 py-3.5 font-semibold">#</th>
                          <th className="px-5 py-3.5 font-semibold">Full Name</th>
                          <th className="px-5 py-3.5 font-semibold">Email</th>
                          <th className="px-5 py-3.5 font-semibold">Mobile</th>
                          <th className="px-5 py-3.5 font-semibold">Registered</th>
                          <th className="px-5 py-3.5 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {filteredRegistrations.map((r, idx) => (
                          <tr key={r.id || idx} className="hover:bg-neutral-800/50 transition-colors">
                            <td className="px-5 py-3.5 text-xs text-neutral-600 font-mono">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-medium text-white">{r.name}</td>
                            <td className="px-5 py-3.5">
                              <a href={`mailto:${r.email}`} className="text-neutral-300 hover:text-white underline underline-offset-2 decoration-neutral-700">{r.email}</a>
                            </td>
                            <td className="px-5 py-3.5">
                              <a href={`tel:${r.phone}`} className="text-neutral-300 hover:text-white underline underline-offset-2 decoration-neutral-700">{r.phone}</a>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-neutral-500">
                              {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleDeleteRegistration(r.id)}
                                className="p-2 text-neutral-600 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                                title="Delete Registration"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards (hidden on desktop) */}
                  <div className="md:hidden divide-y divide-neutral-800">
                    {filteredRegistrations.map((r, idx) => (
                      <div key={r.id || idx} className="p-4 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="font-medium text-white text-sm truncate">{r.name}</p>
                          <a
                            href={`mailto:${r.email}`}
                            className="block text-xs text-neutral-400 truncate active:text-white"
                          >
                            {r.email}
                          </a>
                          <a
                            href={`tel:${r.phone}`}
                            className="block text-xs text-neutral-400 active:text-white"
                          >
                            {r.phone}
                          </a>
                          <p className="text-[11px] text-neutral-600">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteRegistration(r.id)}
                          className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-600 hover:text-white active:text-white rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : regError ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center p-3 bg-neutral-800 text-neutral-400 rounded-full mb-3">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-neutral-300 font-medium text-sm">Database Notice</p>
                  <p className="text-neutral-500 text-xs mt-1 max-w-md mx-auto">{regError}</p>
                  {regError.includes('student_registrations') && (
                    <p className="text-neutral-600 text-xs mt-3 bg-neutral-950 p-3 rounded border border-neutral-800 font-mono inline-block text-left">
                      💡 Ensure table <span className="text-white">student_registrations</span> is created in Supabase.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-neutral-600">
                  No student registrations found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: Gallery Management ─── */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">

            {/* Category Management */}
            <div className="bg-neutral-900 p-4 sm:p-5 rounded-xl border border-neutral-800">
              <h3 className="font-semibold text-white text-sm mb-3">Manage Categories</h3>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 bg-neutral-950 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-neutral-500 transition-colors"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="min-h-[44px] px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg transition-colors font-medium text-sm flex items-center gap-1 disabled:opacity-40 shrink-0 active:scale-95"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-full text-sm">
                    <span className="text-neutral-300">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.name)}
                      className="text-neutral-600 hover:text-white active:text-white transition-colors p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && <span className="text-xs text-neutral-600">No categories found. Add one!</span>}
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-neutral-900 p-4 sm:p-5 rounded-xl border border-neutral-800">
              <h3 className="font-semibold text-white text-sm">Upload New Photo</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                Photos upload to Cloudinary and sync with the database.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider shrink-0">To:</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-neutral-500"
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
                      className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-lg transition-colors font-medium text-sm active:scale-95 disabled:opacity-40"
                    >
                      <Upload size={16} />
                      Upload Photos
                    </button>
                  )}
                </CldUploadWidget>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm shrink-0">Photos ({filteredPhotos.length})</h3>
                  <select
                    value={galleryFilter}
                    onChange={(e) => setGalleryFilter(e.target.value)}
                    className="bg-neutral-950 border border-neutral-700 text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none min-w-0"
                  >
                    <option value="all">All</option>
                    <option value="unlabeled">Unlabeled</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => { fetchGalleryPhotos(); fetchCategories(); }}
                  className="flex items-center gap-1.5 min-h-[36px] px-3 text-xs text-neutral-500 hover:text-white transition-colors active:scale-95"
                >
                  <RefreshCw size={12} className={galleryLoading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {galleryLoading ? (
                <div className="p-12 text-center text-neutral-500">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Loading photos...
                </div>
              ) : filteredPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {filteredPhotos.map((p) => (
                    <div
                      key={p.id}
                      className="group relative bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        className="w-full aspect-square relative overflow-hidden bg-neutral-900 text-left focus:outline-none"
                        onClick={() => setActionSheetPhoto(p)}
                      >
                        <img
                          src={p.secure_url ? p.secure_url.replace('/upload/', '/upload/w_400,q_auto,f_auto/') : ''}
                          alt={p.public_id || 'gallery image'}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Category badge */}
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/70 text-white/80 text-[10px] uppercase font-bold rounded">
                          {p.category || 'unlabeled'}
                        </span>
                        {/* Pin indicator */}
                        {p.is_pinned && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-white/90 rounded-full">
                            <Pin size={10} className="text-black fill-black" />
                          </span>
                        )}
                        {/* More icon overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <MoreVertical size={20} className="text-white/0 group-hover:text-white/80 transition-colors" />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-neutral-600">
                  No photos found for this category.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── Gallery Action Sheet (Bottom Sheet Modal) ─── */}
      {actionSheetPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setActionSheetPhoto(null)}
        >
          <div
            className="w-full sm:max-w-sm bg-neutral-900 border-t sm:border border-neutral-700 rounded-t-2xl sm:rounded-2xl p-4 pb-6 sm:p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                  <img
                    src={actionSheetPhoto.secure_url ? actionSheetPhoto.secure_url.replace('/upload/', '/upload/w_80,h_80,c_fill,q_auto,f_auto/') : ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 truncate">{actionSheetPhoto.public_id?.split('/').pop() || 'Photo'}</p>
                  <p className="text-[11px] text-neutral-600">{actionSheetPhoto.category || 'unlabeled'}</p>
                </div>
              </div>
              <button
                onClick={() => setActionSheetPhoto(null)}
                className="p-2 text-neutral-500 hover:text-white rounded-full active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Change Category */}
            <div className="mb-3">
              <label className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold mb-1.5 block">Change Category</label>
              <select
                value={actionSheetPhoto.category || 'unlabeled'}
                onChange={(e) => handleChangePhotoCategory(actionSheetPhoto.id, e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 text-white text-sm rounded-lg px-3 py-3 focus:outline-none focus:border-neutral-500"
              >
                <option value="unlabeled">Unlabeled</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleTogglePin(actionSheetPhoto.id, !!actionSheetPhoto.is_pinned)}
                className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors active:scale-[0.98] text-sm"
              >
                <Pin size={16} className={actionSheetPhoto.is_pinned ? "fill-white" : ""} />
                {actionSheetPhoto.is_pinned ? 'Unpin from Top' : 'Pin to Top (Max 5)'}
              </button>
              <button
                onClick={() => handleDeletePhoto(actionSheetPhoto.id)}
                className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors active:scale-[0.98] text-sm"
              >
                <Trash2 size={16} />
                Delete Photo
              </button>
            </div>

            {/* Cancel */}
            <button
              onClick={() => setActionSheetPhoto(null)}
              className="w-full min-h-[48px] mt-3 flex items-center justify-center px-4 py-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 rounded-lg transition-colors active:scale-[0.98] text-sm border border-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* ─── In-App Web Modal Dialog (Replaces native browser alert & confirm) ─── */}
      {modalDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            if (modalDialog.type === 'confirm' && modalDialog.onCancel) {
              modalDialog.onCancel();
            } else {
              setModalDialog(null);
            }
          }}
        >
          <div
            className="w-full max-w-sm bg-neutral-900 border border-neutral-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl relative text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top row with icon & close button */}
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0">
                {modalDialog.isDestructive ? (
                  <Trash2 size={20} className="text-white" />
                ) : (
                  <AlertCircle size={20} className="text-white" />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (modalDialog.onCancel) modalDialog.onCancel();
                  setModalDialog(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Title and Message */}
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                {modalDialog.title}
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mt-1">
                {modalDialog.message}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-1">
              {modalDialog.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => {
                    if (modalDialog.onCancel) modalDialog.onCancel();
                    setModalDialog(null);
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium transition-colors active:scale-[0.98] border border-neutral-700/50"
                >
                  {modalDialog.cancelLabel || 'Cancel'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const cb = modalDialog.onConfirm;
                  setModalDialog(null);
                  cb();
                }}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              >
                {modalDialog.confirmLabel || (modalDialog.type === 'confirm' ? 'Confirm' : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
