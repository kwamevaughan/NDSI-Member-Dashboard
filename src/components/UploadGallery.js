import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import Select from "react-select";
import { GenericTable } from "@/components/GenericTable";

export default function UploadGallery({
  mode,
  files,
  loading,
  onRefresh,
  onDelete,
  onStartRename,
  onSubmitRename,
  onMove,
  renamingId,
  renameValue,
  setRenameValue,
}) {
  const [view, setView] = useState("grid");
  const [previewFile, setPreviewFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editName, setEditName] = useState("");
  const [editFolderOpt, setEditFolderOpt] = useState(null);

  const FOLDERS = useMemo(() => ([
    { label: 'Strategic Documents', value: 'StrategicDocs' },
    { label: 'Training Materials', value: 'TrainingMaterials' },
    { label: 'Working Groups', value: 'WorkingGroups' },
  ]), []);

  // No subfolder concept anymore

  const empty = !loading && (!files || files.length === 0);

  return (
    <section
      className={`rounded-3xl ${
        mode === "dark"
          ? "bg-gray-800 border border-gray-700/50 shadow-2xl shadow-blue-500/10"
          : "bg-white border border-gray-200 shadow-2xl shadow-gray-500/10"
      } p-6 md:p-8 relative overflow-hidden`}
    >
      <div className="absolute inset-0  pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  mode === "dark"
                    ? "bg-ndsi-blue"
                    : "bg-ndsi-blue"
                } shadow-lg shadow-blue-500/30`}
              >
                <Icon
                  icon="mdi:image-multiple"
                  className="w-5 h-5 text-white"
                />
              </div>
              <h2 className={`text-xl font-bold text-ndsi-blue`}>
                Gallery
              </h2>
            </div>

            <div
              className={`inline-flex rounded-xl overflow-hidden p-1 ${
                mode === "dark"
                  ? "bg-gray-800 border border-gray-700/50"
                  : "bg-gray-100 border border-gray-200/50"
              } shadow-inner`}
            >
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  view === "grid"
                    ? "bg-ndsi-blue text-white shadow-lg shadow-blue-500/30 scale-105"
                    : mode === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
                }`}
                onClick={() => setView("grid")}
              >
                <Icon icon="mdi:view-grid" className="w-4 h-4 inline mr-1" />
                Grid
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  view === "list"
                    ? "bg-ndsi-blue text-white shadow-lg shadow-blue-500/30 scale-105"
                    : mode === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
                }`}
                onClick={() => setView("list")}
              >
                <Icon icon="mdi:view-list" className="w-4 h-4 inline mr-1" />
                List
              </button>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className={`group px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              mode === "dark"
                ? "bg-gray-700 hover:bg-gray-600 border border-gray-600/50"
                : "bg-gray-100 hover:bg-gray-200 border border-gray-300/50"
            } shadow-lg hover:shadow-xl hover:scale-105`}
          >
            <Icon
              icon="mdi:refresh"
              className="w-4 h-4 inline mr-2 group-hover:rotate-180 transition-transform duration-500"
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-flex items-center gap-3">
              <Icon
                icon="mdi:loading"
                className="w-8 h-8 text-blue-500 animate-spin"
              />
              <span
                className={`text-base ${
                  mode === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Loading your files...
              </span>
            </div>
          </div>
        ) : empty ? (
          <div className="py-24 text-center">
            <div
              className={`w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center ${
                mode === "dark" ? "bg-gray-800/50" : "bg-gray-100/80"
              } backdrop-blur-sm`}
            >
              <Icon
                icon="mdi:folder-open-outline"
                className={`w-10 h-10 ${
                  mode === "dark" ? "text-gray-600" : "text-gray-400"
                }`}
              />
            </div>
            <p
              className={`text-base font-medium ${
                mode === "dark" ? "text-gray-500" : "text-gray-500"
              }`}
            >
              No files found
            </p>
            <p
              className={`text-sm ${
                mode === "dark" ? "text-gray-600" : "text-gray-400"
              } mt-1`}
            >
              Upload some files to get started
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="max-h-[60vh] overflow-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {files.map((file) => {
              const isPdf = file.name?.toLowerCase().endsWith(".pdf");
              return (
                <div
                  key={file.fileId}
                  className={`group relative rounded-2xl backdrop-blur-sm ${
                    mode === "dark"
                      ? "bg-gray-800 border border-gray-700/50 hover:border-ndsi-blue/50"
                      : "bg-white border border-gray-200/80 hover:border-ndsi-blue/50"
                  } p-5 flex flex-col hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}
                >
                  <div className="absolute inset-0 bg-ndsi-blue/10 rounded-2xl transition-all duration-300 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isPdf
                          ? "bg-red-500 shadow-md"
                          : "bg-ndsi-blue shadow-md"
                      } transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <Icon
                        icon={isPdf ? "mdi:file-pdf" : "mdi:file-word"}
                        className="w-6 h-6 text-white"
                      />
                    </div>
                    {renamingId !== file.fileId && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => {
                            setEditingFile(file);
                            setEditName(file.name.replace(/\.[^.]+$/, ''));
                            const parts = (file.filePath || file.name || '').split('/').filter(Boolean);
                            const folderVal = parts[0] || '';
                            const folderOpt = FOLDERS.find(f=>f.value===folderVal) || null;
                            setEditFolderOpt(folderOpt);
                          }}
                          className={`p-2.5 rounded-xl transition-all duration-300 ${
                            mode === "dark"
                              ? "hover:bg-gray-700/50 text-gray-400 hover:text-white"
                              : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                          }`}
                          title="Edit"
                        >
                          <Icon icon="mdi:cog" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPreviewFile(file)}
                          className={`p-2.5 rounded-xl transition-all duration-300 ${
                            mode === "dark"
                              ? "hover:bg-gray-700/50 text-gray-400 hover:text-white"
                              : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                          }`}
                          title="Preview"
                        >
                          <Icon icon="mdi:eye" className="w-4 h-4" />
                        </button>
                        {/* Rename handled inside Edit modal */}
                        <button
                          onClick={() => onDelete(file.fileId)}
                          className={`p-2.5 rounded-xl transition-all duration-300 ${
                            mode === "dark"
                              ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                              : "hover:bg-red-500/10 text-gray-500 hover:text-red-600"
                          }`}
                          title="Delete"
                        >
                          <Icon icon="mdi:delete" className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex-1 min-w-0">
                    {renamingId === file.fileId ? (
                      <div className="space-y-3">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                            mode === "dark"
                              ? "bg-gray-900/50 text-white border-gray-700 focus:border-blue-500"
                              : "bg-white text-black border-gray-300 focus:border-blue-500"
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSubmitRename(file.fileId)}
                            className="flex-1 px-3 py-2 rounded-xl bg-ndsi-green text-white text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            <Icon
                              icon="mdi:check"
                              className="w-3 h-3 inline mr-1"
                            />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              onStartRename(null);
                              setRenameValue("");
                            }}
                            className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                              mode === "dark"
                                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <a
                          className={`text-sm font-semibold block truncate hover:text-blue-500 transition-colors duration-300 ${
                            mode === "dark" ? "text-white" : "text-gray-900"
                          }`}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.name}
                        </a>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Icon
                            icon="mdi:folder-outline"
                            className={`w-3 h-3 ${
                              mode === "dark"
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          />
                          <p
                            className={`text-xs truncate ${
                              mode === "dark"
                                ? "text-gray-500"
                                : "text-gray-500"
                            }`}
                            title={file.filePath}
                          >
                            {file.filePath}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        ) : (
          <GenericTable
            data={(files || []).map(f => ({
              id: f.fileId,
              name: f.name,
              path: f.filePath,
              url: f.url,
              raw: f,
            }))}
            columns={[
              { header: 'name', accessor: 'name', sortable: true },
              { header: 'path', accessor: 'path' },
            ]}
            title={"Files"}
            emptyMessage={"No files found"}
            searchable={true}
            loading={false}
            onRefresh={onRefresh}
            onEdit={(row) => {
              const file = row.raw;
              setEditingFile(file);
              setEditName(file.name.replace(/\.[^.]+$/, ''));
              const parts = (file.filePath || file.name || '').split('/').filter(Boolean);
              const folderVal = parts[0] || '';
              const folderOpt = FOLDERS.find(f=>f.value===folderVal) || null;
              setEditFolderOpt(folderOpt);
            }}
            onDelete={(row) => onDelete(row.id)}
            actions={[
              {
                label: 'Preview',
                icon: 'mdi:eye',
                onClick: (row) => setPreviewFile(row.raw),
              },
            ]}
          />
        )}
      </div>

      {/* Preview Modal */}
      <SimpleModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name || "Preview"}
        width="max-w-5xl"
      >
        {previewFile && (
          previewFile.name?.toLowerCase().endsWith('.pdf') ? (
            <iframe
              src={previewFile.url}
              title={previewFile.name}
              className="w-full h-[70vh] rounded-xl border"
            />
          ) : (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile.url)}&embedded=true`}
              title={previewFile.name}
              className={`w-full h-[70vh] rounded-xl border ${mode === 'dark' ? 'bg-[#286380]' : 'bg-white'}`}
              style={{ backgroundColor: mode === 'dark' ? '#286380' : '#fff' }}
            />
          )
        )}
      </SimpleModal>

      {/* Edit Modal */}
      <SimpleModal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        title={"Edit File"}
        width="max-w-2xl"
      >
        {editingFile && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">File name</label>
              <div className="flex gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === 'dark' ? 'bg-transparent text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
                />
                <button
                  className="px-3 py-2 rounded-lg bg-ndsi-blue text-white text-sm"
                  onClick={() => onStartRename(editingFile)}
                  style={{ display: 'none' }}
                >
                  Hidden
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Folder</label>
              <Select
                value={editFolderOpt}
                onChange={(opt) => setEditFolderOpt(opt)}
                options={FOLDERS}
                isClearable
                classNamePrefix="rs"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className={`px-4 py-2 rounded-lg text-sm ${mode==='dark'?'bg-gray-800 text-white':'bg-gray-100 text-gray-800'}`}
                onClick={() => setEditingFile(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm bg-ndsi-blue text-white"
                onClick={() => {
                  onSubmitRename(editingFile.fileId, editName);
                  setEditingFile(null);
                }}
              >
                Save name
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm bg-ndsi-green text-white"
                onClick={() => {
                  const src = editingFile.filePath || `/${editingFile.name}`;
                  const base = editFolderOpt?.value ? `/${editFolderOpt.value}` : '';
                  const dest = `${base}/${editingFile.name}`;
                  onMove?.(src, dest);
                  setEditingFile(null);
                }}
              >
                Move file
              </button>
            </div>
          </div>
        )}
      </SimpleModal>
    </section>
  );
}
