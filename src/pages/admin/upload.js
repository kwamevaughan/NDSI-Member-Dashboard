import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/layouts/adminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
// Note: Avoid importing member auth hooks here to prevent unintended redirects
import useSidebar from '@/hooks/useSidebar';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'react-hot-toast';
import { Icon } from '@iconify/react';
import { listAllFilesByPrefix } from '@/utils/imageKitService';
import UploadGallery from '@/components/UploadGallery';

const TARGET_FOLDERS = [
  { label: 'Strategic Documents', value: 'StrategicDocs' },
  { label: 'Training Materials', value: 'TrainingMaterials' },
  { label: 'Working Groups', value: 'WorkingGroups' },
];

function humanFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

export default function AdminUploadPage() {
  const { adminUser, loading: authLoading } = useAdminAuth();
  const { mode, toggleMode } = useTheme();

  const [folder, setFolder] = useState(TARGET_FOLDERS[0].value);
  // Subfolders removed; uploads go directly under the selected folder
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef(null);
  const adminTokenRef = useRef(null);
  const renameRefreshRef = useRef(null);
  const isRefreshingRenameRef = useRef(false);
  const optimisticRenameRef = useRef({});
  const optimisticDeletedSetRef = useRef(new Set());
  const optimisticAddedMapRef = useRef({});

  // Capture a stable admin token once
  useEffect(() => {
    adminTokenRef.current = localStorage.getItem('admin_token') || null;
  }, []);

  // Subfolder loading removed

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = Array.from(e.dataTransfer.files || []);
    addFiles(dropped);
  }, []);

  const addFiles = (selected) => {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const next = [];
    for (const f of selected) {
      if (!allowed.includes(f.type)) {
        toast.error(`Unsupported type: ${f.name}`);
        continue;
      }
      next.push({ file: f, id: `${f.name}-${f.size}-${f.lastModified}` });
    }
    if (next.length) setFiles(prev => [...prev, ...next]);
  };

  const onBrowse = (e) => {
    addFiles(Array.from(e.target.files || []));
    // reset input so selecting same file again triggers change
    e.target.value = '';
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));
  const clearFiles = () => setFiles([]);

  const resolvedFolder = useMemo(() => `/${folder}`,[folder]);

  const uploadAll = async () => {
    const token = adminTokenRef.current || localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Not authenticated');
      return;
    }
    if (files.length === 0) {
      toast('Select files to upload');
      return;
    }
    setUploading(true);
    setProgressMap({});
    const toastId = toast.loading('Uploading files...');
    try {
      for (const item of files) {
        const f = item.file;
        setProgressMap(prev => ({ ...prev, [item.id]: 5 }));
        const base64 = await fileToDataUrl(f);
        setProgressMap(prev => ({ ...prev, [item.id]: 25 }));
        const res = await fetch('/api/admin/upload-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: f.name,
            folder: resolvedFolder,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Upload failed');
        }
        const { file: up } = await res.json();
        setProgressMap(prev => ({ ...prev, [item.id]: 100 }));
        if (up?.id || up?.fileId) {
          const fileId = up.id || up.fileId;
          const url = up.url;
          const originalName = f.name;
          const newDoc = {
            id: fileId,
            fileId,
            title: originalName,
            name: originalName,
            type: originalName.split('.').pop()?.toLowerCase(),
            year: new Date().getFullYear(),
            date: new Date().toISOString().slice(0,10),
            url,
            folderPath: resolvedFolder,
          };
          optimisticAddedMapRef.current[fileId] = newDoc;
          setGalleryFiles(prev => prev.find(d => d.fileId === fileId) ? prev : [...prev, newDoc]);
        }
      }
      toast.dismiss(toastId);
      toast.success('All files uploaded');
      clearFiles();
      // Backoff confirm
      const attempts = [600, 1200, 2000];
      for (const d of attempts) {
        await new Promise(r => setTimeout(r, d));
        const now = await fetchGalleryFiles();
        setGalleryFiles(now);
      }
      // Clean optimistic adds that now exist
      const latest = await fetchGalleryFiles();
      for (const k in optimisticAddedMapRef.current) {
        if (latest.find(f => f.fileId === k)) delete optimisticAddedMapRef.current[k];
      }
    } catch (e) {
      toast.dismiss(toastId);
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fetchGalleryFiles = useCallback(async () => {
    const token = adminTokenRef.current || localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/files-list?prefix=${encodeURIComponent(resolvedFolder)}&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load files');
      let files = (data.files || []).map(f => ({ ...f }));
      // Suppress recently deleted
      const deleted = optimisticDeletedSetRef.current || new Set();
      if (deleted.size) files = files.filter(f => !deleted.has(f.fileId));
      // Apply rename overlays
      const overlays = optimisticRenameRef.current || {};
      files = files.map(f => {
        const o = overlays[f.fileId];
        if (o && o.name) {
          const nf = { ...f, name: o.name };
          if (o.filePath) nf.filePath = o.filePath;
          return nf;
        }
        return f;
      });
      // Include optimistic additions
      const added = optimisticAddedMapRef.current || {};
      for (const k in added) {
        if (!files.find(f => f.fileId === k)) files.push({ ...added[k] });
      }
      return files;
    } catch (e) {
      toast.error(e.message);
      return [];
    }
  }, [resolvedFolder]);

  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const files = await fetchGalleryFiles();
      setGalleryFiles(files);
    } finally {
      setGalleryLoading(false);
    }
  }, [fetchGalleryFiles]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleDelete = async (fileId) => {
    const token = adminTokenRef.current || localStorage.getItem('admin_token');
    if (!token) return;
    if (!confirm('Delete this file?')) return;
    const toastId = toast.loading('Deleting...');
    optimisticDeletedSetRef.current.add(fileId);
    setGalleryFiles(prev => prev.filter(f => f.fileId !== fileId));
    try {
      const res = await fetch('/api/admin/files-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.dismiss(toastId);
      toast.success('Deleted');
      const attempts = [600, 1200, 2000];
      for (const d of attempts) {
        await new Promise(r => setTimeout(r, d));
        const now = await fetchGalleryFiles();
        setGalleryFiles(now);
      }
      setTimeout(() => { optimisticDeletedSetRef.current.delete(fileId); }, 8000);
    } catch (e) {
      toast.dismiss(toastId);
      toast.error(e.message);
      optimisticDeletedSetRef.current.delete(fileId);
      loadGallery();
    }
  };

  const startRename = (file) => {
    setRenamingId(file.fileId);
    // Pre-fill without extension to prevent accidental removal of extension
    const base = file.name.replace(/\.[^.]+$/, '');
    setRenameValue(base);
  };

  const submitRename = async (fileId, baseOverride) => {
    const token = adminTokenRef.current || localStorage.getItem('admin_token');
    if (!token) return;
    const baseName = (baseOverride ?? renameValue).trim();
    if (!baseName) return;
    const original = galleryFiles.find(f => f.fileId === fileId);
    const ext = original?.name?.match(/\.[^.]+$/)?.[0] || '';
    const newName = `${baseName}${ext}`;
    const toastId = toast.loading('Renaming...');
    // Optimistically update UI
    setGalleryFiles(prev => prev.map(f => {
      if (f.fileId !== fileId) return f;
      const updated = { ...f };
      updated.name = newName;
      if (updated.filePath) {
        updated.filePath = updated.filePath.replace(/[^/]+$/, newName);
      }
      return updated;
    }));
    // Track optimistic overlay to suppress flicker during propagation
    const current = galleryFiles.find(f => f.fileId === fileId);
    optimisticRenameRef.current[fileId] = {
      name: newName,
      filePath: current?.filePath ? current.filePath.replace(/[^/]+$/, newName) : undefined,
    };
    // Safety cleanup for overlay
    setTimeout(() => { delete optimisticRenameRef.current[fileId]; }, 15000);
    try {
      const res = await fetch('/api/admin/files-rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filePath: (galleryFiles.find(f => f.fileId === fileId)?.filePath) || (galleryFiles.find(f => f.fileId === fileId)?.name), newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rename failed');
      toast.dismiss(toastId);
      toast.success('Renamed');
      setRenamingId(null);
      setRenameValue('');
      // Retry refresh with backoff until the renamed filename appears, to avoid stale caches
      if (isRefreshingRenameRef.current) return;
      isRefreshingRenameRef.current = true;
      const attempts = [800, 1500, 2500, 3500];
      let found = false;
      for (const delay of attempts) {
        await new Promise(r => setTimeout(r, delay));
        const files = await fetchGalleryFiles();
        setGalleryFiles(files);
        const renamed = files.find(f => f.fileId === fileId && f.name === newName);
        if (renamed) { found = true; break; }
      }
      // Clear optimistic overlay when confirmed or after attempts
      delete optimisticRenameRef.current[fileId];
      isRefreshingRenameRef.current = false;
    } catch (e) {
      toast.dismiss(toastId);
      toast.error(e.message);
      // Reload to revert optimistic change
      loadGallery();
    }
  };

  if (authLoading) return null;
  if (!adminUser) return null;

  return (
    <div
      className={`flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50`}
    >
      <Header />
      <main className="flex-1 p-4 md:p-8 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-normal text-[#28A8E0] mb-2">
            Upload Documents
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Upload PDF or DOCX files to ImageKit and they will appear across the
            app.
          </p>

          <section
            className={`rounded-2xl border ${
              mode === "dark"
                ? "border-gray-700 bg-[#0f1429]"
                : "border-gray-200 bg-white"
            } p-5 md:p-6 mb-6`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Destination
                </label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    mode === "dark"
                      ? "bg-transparent text-white border-gray-700"
                      : "bg-white text-black border-gray-300"
                  }`}
                >
                  {TARGET_FOLDERS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Subfolder options removed */}
            </div>
          </section>

          <section
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`rounded-2xl border-2 border-dashed ${
              mode === "dark"
                ? "border-gray-700 bg-[#0f1429]"
                : "border-gray-300 bg-white"
            } p-8 flex flex-col items-center justify-center text-center mb-6`}
          >
            <Icon
              icon="mdi:cloud-upload"
              className="w-12 h-12 text-[#28A8E0] mb-3"
            />
            <p className="text-sm mb-2">Drag and drop files here</p>
            <p className="text-xs text-gray-500 mb-4">
              PDF or DOCX, up to 25MB each
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-[#28A8E0] text-white hover:bg-[#1c7aa5] text-sm"
              >
                Browse files
              </button>
              {files.length > 0 && (
                <button
                  onClick={clearFiles}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    mode === "dark"
                      ? "bg-gray-800 text-white hover:bg-gray-700"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  Clear
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onBrowse}
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
          </section>

          <section
            className={`rounded-2xl border ${
              mode === "dark"
                ? "border-gray-700 bg-[#0f1429]"
                : "border-gray-200 bg-white"
            } p-5 md:p-6 mb-6`}
          >
            <h2 className="text-base font-medium mb-3">Tips</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                Use a leading year in filenames (e.g., 2024 - Report.pdf) to
                help sorting.
              </li>
              
            </ul>
          </section>

          {files.length > 0 && (
            <section
              className={`rounded-2xl border ${
                mode === "dark"
                  ? "border-gray-700 bg-[#0f1429]"
                  : "border-gray-200 bg-white"
              } p-4 md:p-5 mb-6`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-medium">Files ready to upload</h2>
                <button
                  disabled={uploading}
                  onClick={uploadAll}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                    uploading ? "opacity-60 cursor-not-allowed" : ""
                  } ${
                    mode === "dark"
                      ? "bg-ndsi-blue text-white hover:bg-ndsi-blue/80"
                      : "bg-ndsi-blue text-white hover:bg-ndsi-blue/80"
                  }`}
                >
                  <Icon icon="mdi:upload" className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload all"}
                </button>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {files.map((item) => (
                  <li key={item.id} className="py-3 flex items-center gap-3">
                    <Icon
                      icon={
                        item.file.type.includes("pdf")
                          ? "mdi:file-pdf"
                          : "mdi:file-word"
                      }
                      className="w-6 h-6 text-[#28A8E0]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {humanFileSize(item.file.size)}
                      </p>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 mt-2 overflow-hidden">
                        <div
                          className="h-full bg-[#28A8E0] transition-all"
                          style={{ width: `${progressMap[item.id] || 0}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(item.id)}
                      disabled={uploading}
                      className={`p-2 rounded-lg ${
                        mode === "dark"
                          ? "hover:bg-gray-800"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Icon icon="mdi:close" className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <UploadGallery
            mode={mode}
            files={galleryFiles}
            loading={galleryLoading}
            onRefresh={loadGallery}
            onDelete={handleDelete}
            onStartRename={(file) =>
              file ? startRename(file) : setRenamingId(null)
            }
            onSubmitRename={submitRename}
            onMove={async (sourceFilePath, destinationPath) => {
              const token = adminTokenRef.current || localStorage.getItem('admin_token');
              if (!token) return;
              const toastId = toast.loading('Moving file...');
              try {
                const res = await fetch('/api/admin/files-move', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ sourceFilePath, destinationPath }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Move failed');
                toast.dismiss(toastId);
                toast.success('File moved');
                await loadGallery();
              } catch (e) {
                toast.dismiss(toastId);
                toast.error(e.message);
              }
            }}
            renamingId={renamingId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
          />
        </div>
      </main>
    </div>
  );
}


