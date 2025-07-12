import { useState, useEffect } from "react";
import { Icon } from '@iconify/react';
import SimpleModal from "@/components/SimpleModal";
import {
  listFilesInFolder,
  listSubfoldersInFolder,
  listAllFilesByPrefix,
} from "@/utils/imageKitService";

function truncateText(text, maxLength = 25) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

const DocumentGrid = ({
  folder,
  title,
  description = "Browse and filter documents below.",
  mode,
  showSubfolderFilter = false,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [subfolders, setSubfolders] = useState([]);
  const [subfolderFilter, setSubfolderFilter] = useState("all");

  useEffect(() => {
    if (!showSubfolderFilter) return;
    const fetchSubfolders = async () => {
      try {
        const folders = await listSubfoldersInFolder(`/${folder}`);
        setSubfolders(folders);
      } catch {
        setSubfolders([]);
      }
    };
    fetchSubfolders();
  }, [folder, showSubfolderFilter]);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        let docsRaw = [];
        if (showSubfolderFilter && subfolderFilter === "all") {
          docsRaw = await listAllFilesByPrefix(`/${folder}`);
        } else {
          let fetchPath = `/${folder}`;
          if (showSubfolderFilter && subfolderFilter !== "all") {
            fetchPath = `/${folder}/${subfolderFilter}`;
          }
          docsRaw = await listFilesInFolder(fetchPath);
        }

        const docs = docsRaw
          .filter((f) =>
            ["pdf", "docx"].includes(f.name.split(".").pop().toLowerCase())
          )
          .map((f) => {
            const yearMatch = f.name.match(/^(\d{4})\s*[-_]/);
            const year = yearMatch
              ? parseInt(yearMatch[1], 10)
              : new Date(f.createdAt).getFullYear();
            return {
              id: f.fileId,
              title: f.name,
              type: f.name.split(".").pop().toLowerCase(),
              year,
              date: f.createdAt.split("T")[0],
              url: f.url,
            };
          });

        setDocuments(docs);
      } catch (err) {
        setError("Failed to load documents.");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [folder, showSubfolderFilter, subfolderFilter]);

  const years = [...new Set(documents.map((doc) => doc.year))];
  const filteredDocuments = documents.filter((doc) => {
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesYear = yearFilter === "all" || doc.year === Number(yearFilter);
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesType && matchesYear && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl md:text-4xl font-semibold text-[#28A8E0] mb-4">
          {title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-[#28A8E0] ${
            mode === "dark"
              ? "bg-transparent text-white border-gray-700"
              : "bg-white text-black border-gray-300"
          }`}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${
            mode === "dark"
              ? "bg-transparent text-white border-gray-700"
              : "bg-white text-black border-gray-300"
          }`}
        >
          <option value="all">All Types</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${
            mode === "dark"
              ? "bg-transparent text-white border-gray-700"
              : "bg-white text-black border-gray-300"
          }`}
        >
          <option value="all">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {showSubfolderFilter && (
          <select
            value={subfolderFilter}
            onChange={(e) => setSubfolderFilter(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${
              mode === "dark"
                ? "bg-[#286380] text-white border-gray-700"
                : "bg-white text-black border-gray-300"
            }`}
          >
            <option value="all">All Categories</option>
            {subfolders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          Loading documents…
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No documents found.
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`flex flex-col items-center p-5 rounded-2xl shadow hover:shadow-lg transition-all ${
                mode === "dark"
                  ? "bg-[#19506a] text-white"
                  : "bg-white text-black"
              }`}
            >
              <div className="mb-4">
                {doc.type === "pdf" ? (
                  <Icon icon="mdi:file-pdf" className="text-5xl text-red-500" />
                ) : (
                  <Icon icon="mdi:file-word" className="text-5xl text-blue-500" />
                )}
              </div>
              <div className="text-center flex-1">
                <h3 className="font-medium text-lg line-clamp-2">
                  {truncateText(doc.title)}
                </h3>
                <p className="text-xs text-gray-400">
                  {doc.type.toUpperCase()} &bull; {doc.year}
                </p>
                <p className="text-xs text-gray-400">Uploaded: {doc.date}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedDoc(doc);
                  setModalOpen(true);
                }}
                className="mt-4 w-full bg-[#28A8E0] hover:bg-[#8dc63f] text-white font-semibold py-2 rounded-lg transition"
              >
                View Document
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <SimpleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedDoc(null);
        }}
        title={selectedDoc?.title || ""}
        mode={mode}
        width="max-w-5xl"
      >
        {selectedDoc?.type === "pdf" ? (
          <iframe
            src={selectedDoc.url}
            title={selectedDoc.title}
            className="w-full h-[70vh] rounded-xl border"
          />
        ) : selectedDoc?.type === "docx" ? (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              selectedDoc.url
            )}&embedded=true`}
            title={selectedDoc.title}
            className={`w-full h-[70vh] rounded-xl border ${
              mode === "dark" ? "bg-[#286380]" : "bg-white"
            }`}
            style={{ backgroundColor: mode === "dark" ? "#286380" : "#fff" }}
          />
        ) : null}
      </SimpleModal>
    </div>
  );
};

export default DocumentGrid;
