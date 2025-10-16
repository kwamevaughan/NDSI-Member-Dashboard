import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/layouts/adminHeader';
import { useUser } from '@/context/UserContext';
import useSignOut from '@/hooks/useSignOut';
import useSidebar from '@/hooks/useSidebar';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'react-hot-toast';
import { Icon } from '@iconify/react';
import { listAllFilesByPrefix } from '@/utils/imageKitService';

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
  const { user, token } = useUser();
  const { handleSignOut } = useSignOut();
  const { mode, toggleMode } = useTheme();

  const [folder, setFolder] = useState(TARGET_FOLDERS[0].value);
  const [subfolder, setSubfolder] = useState('');
  const [customSubfolder, setCustomSubfolder] = useState('');
  const [knownSubfolders, setKnownSubfolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef(null);

  // Load known subfolders by prefix
  useEffect(() => {
    const loadSubfolders = async () => {
      try {
        const prefix = `/${folder}`;
        const all = await listAllFilesByPrefix(prefix);
        const names = new Set();
        all.forEach(f => {
          const parts = (f.filePath || '').split('/').filter(Boolean);
          if (parts.length >= 2 && parts[0] === folder) {
            names.add(parts[1]);
          }
        });
        setKnownSubfolders(Array.from(names).sort());
      } catch (e) {
        setKnownSubfolders([]);
      }
    };
    loadSubfolders();
  }, [folder]);

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

  const resolvedFolder = useMemo(() => {
    const base = `/${folder}`;
    const sub = (customSubfolder || subfolder || '').trim();
    if (!sub) return base;
    return `${base}/${sub}`;
  }, [folder, subfolder, customSubfolder]);

  const uploadAll = async () => {
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
        setProgressMap(prev => ({ ...prev, [item.id]: 100 }));
      }
      toast.success('All files uploaded');
      clearFiles();
    } catch (e) {
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

  const loadGallery = useCallback(async () => {
    if (!token) return;
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/admin/files-list?prefix=${encodeURIComponent(resolvedFolder)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load files');
      setGalleryFiles(data.files || []);
    } catch (e) {
      toast.error(e.message);
      setGalleryFiles([]);
    } finally {
      setGalleryLoading(false);
    }
  }, [token, resolvedFolder]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleDelete = async (fileId) => {
    if (!token) return;
    if (!confirm('Delete this file?')) return;
    try {
      const res = await fetch('/api/admin/files-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success('Deleted');
      loadGallery();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const startRename = (file) => {
    setRenamingId(file.fileId);
    setRenameValue(file.name);
  };

  const submitRename = async (fileId) => {
    if (!token) return;
    const newName = renameValue.trim();
    if (!newName) return;
    try {
      const res = await fetch('/api/admin/files-rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileId, newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rename failed');
      toast.success('Renamed');
      setRenamingId(null);
      setRenameValue('');
      loadGallery();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${mode === 'dark' ? 'bg-[#0a0c1d] text-white' : 'bg-[#f7f1eb] text-black'}`}>
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-[100px]">
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-normal text-[#28A8E0] mb-2">Upload Documents</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Upload PDF or DOCX files to ImageKit and they will appear across the app.</p>

            <section className={`rounded-2xl border ${mode === 'dark' ? 'border-gray-700 bg-[#0f1429]' : 'border-gray-200 bg-white'} p-5 md:p-6 mb-6`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Destination</label>
                  <select value={folder} onChange={(e) => setFolder(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${mode === 'dark' ? 'bg-transparent text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}>
                    {TARGET_FOLDERS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subfolder</label>
                  <select value={subfolder} onChange={(e) => setSubfolder(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${mode === 'dark' ? 'bg-transparent text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}>
                    <option value="">None</option>
                    {knownSubfolders.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Or create new subfolder</label>
                  <input value={customSubfolder} onChange={(e) => setCustomSubfolder(e.target.value)} placeholder="e.g. Webinar 7" className={`w-full rounded-lg border px-3 py-2 text-sm ${mode === 'dark' ? 'bg-transparent text-white border-gray-700' : 'bg-white text-black border-gray-300'}`} />
                </div>
              </div>
            </section>

            <section onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} className={`rounded-2xl border-2 border-dashed ${mode === 'dark' ? 'border-gray-700 bg-[#0f1429]' : 'border-gray-300 bg-white'} p-8 flex flex-col items-center justify-center text-center mb-6`}
            >
              <Icon icon="mdi:cloud-upload" className="w-12 h-12 text-[#28A8E0] mb-3" />
              <p className="text-sm mb-2">Drag and drop files here</p>
              <p className="text-xs text-gray-500 mb-4">PDF or DOCX, up to 25MB each</p>
              <div className="flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-[#28A8E0] text-white hover:bg-[#1c7aa5] text-sm">Browse files</button>
                {files.length > 0 && (
                  <button onClick={clearFiles} className={`px-4 py-2 rounded-lg text-sm ${mode === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>Clear</button>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple onChange={onBrowse} accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" />
            </section>

            {files.length > 0 && (
              <section className={`rounded-2xl border ${mode === 'dark' ? 'border-gray-700 bg-[#0f1429]' : 'border-gray-200 bg-white'} p-4 md:p-5 mb-6`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-medium">Files ready to upload</h2>
                  <button disabled={uploading} onClick={uploadAll} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${uploading ? 'opacity-60 cursor-not-allowed' : ''} ${mode === 'dark' ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-green-600 text-white hover:bg-green-500'}`}>
                    <Icon icon="mdi:upload" className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload all'}
                  </button>
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                  {files.map(item => (
                    <li key={item.id} className="py-3 flex items-center gap-3">
                      <Icon icon={item.file.type.includes('pdf') ? 'mdi:file-pdf' : 'mdi:file-word'} className="w-6 h-6 text-[#28A8E0]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.file.name}</p>
                        <p className="text-xs text-gray-500">{humanFileSize(item.file.size)}</p>
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 mt-2 overflow-hidden">
                          <div className="h-full bg-[#28A8E0] transition-all" style={{ width: `${progressMap[item.id] || 0}%` }} />
                        </div>
                      </div>
                      <button onClick={() => removeFile(item.id)} disabled={uploading} className={`p-2 rounded-lg ${mode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                        <Icon icon="mdi:close" className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={`rounded-2xl border ${mode === 'dark' ? 'border-gray-700 bg-[#0f1429]' : 'border-gray-200 bg-white'} p-4 md:p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium">Gallery</h2>
                <button onClick={loadGallery} className={`px-3 py-2 rounded-lg text-sm ${mode === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Refresh</button>
              </div>
              {galleryLoading ? (
                <div className="py-16 text-center text-sm text-gray-500">Loading...</div>
              ) : galleryFiles.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-500">No files found in this destination.</div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                  {galleryFiles.map(file => (
                    <li key={file.fileId} className="py-3 flex items-center gap-3">
                      <Icon icon={file.name?.toLowerCase().endsWith('.pdf') ? 'mdi:file-pdf' : 'mdi:file-word'} className="w-6 h-6 text-[#28A8E0]" />
                      <div className="flex-1 min-w-0">
                        {renamingId === file.fileId ? (
                          <div className="flex items-center gap-2">
                            <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm ${mode === 'dark' ? 'bg-transparent text-white border-gray-700' : 'bg-white text-black border-gray-300'}`} />
                            <button onClick={() => submitRename(file.fileId)} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm">Save</button>
                            <button onClick={() => { setRenamingId(null); setRenameValue(''); }} className={`px-3 py-2 rounded-lg text-sm ${mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm truncate"><a className="underline" href={file.url} target="_blank" rel="noreferrer">{file.name}</a></p>
                            <p className="text-xs text-gray-500">{file.filePath}</p>
                          </>
                        )}
                      </div>
                      {renamingId !== file.fileId && (
                        <>
                          <button onClick={() => startRename(file)} className={`p-2 rounded-lg ${mode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                            <Icon icon="mdi:pencil" className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(file.fileId)} className={`p-2 rounded-lg ${mode === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                            <Icon icon="mdi:delete" className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`rounded-2xl border ${mode === 'dark' ? 'border-gray-700 bg-[#0f1429]' : 'border-gray-200 bg-white'} p-5 md:p-6`}>
              <h2 className="text-base font-medium mb-3">Tips</h2>
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>Use a leading year in filenames (e.g., 2024 - Report.pdf) to help sorting.</li>
                <li>Choose or create a subfolder to group related documents (e.g., Webinar 3).</li>
              </ul>
            </section>
        </div>
      </main>
    </div>
  );
}


