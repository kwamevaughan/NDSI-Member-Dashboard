import { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import {
  listFilesInFolder,
  listSubfoldersInFolder,
  listAllFilesByPrefix,
} from "@/utils/imageKitService";
import DocumentCard from "./DocumentCard";

// Helper function to download file
const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback to opening in new tab
    window.open(url, '_blank');
  }
};



// Reusable DocumentGrid component
const DocumentGridComponent = ({ documents, mode, onViewDoc, onDownloadDoc, emptyMessage = "No documents found matching your criteria." }) => (
  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {documents.length > 0 ? (
      documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          mode={mode}
          onView={() => onViewDoc(doc)}
          onDownload={() => onDownloadDoc(doc)}
        />
      ))
    ) : (
      <div className="text-center py-20 text-gray-400 col-span-full">
        {emptyMessage}
      </div>
    )}
  </div>
);

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

  // Helper functions for document actions
  const handleViewDoc = (doc) => {
    setSelectedDoc(doc);
    setModalOpen(true);
  };

  const handleDownloadDoc = (doc) => {
    downloadFile(doc.url, doc.title);
  };

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
        console.log('Fetching all files with prefix:', `/${folder}`);
        let docsRaw = await listAllFilesByPrefix(`/${folder}`);

        console.log('Raw documents from API:', docsRaw);

        const docs = docsRaw
          .filter((f) => {
            const ext = f.name.split(".").pop().toLowerCase();
            const isValid = ["pdf", "docx"].includes(ext);
            if (!isValid) {
              console.log('Skipping file with unsupported extension:', f.name);
            }
            return isValid;
          })
          .map((f) => {
            const yearMatch = f.name.match(/^(\d{4})\s*[-_]/);
            const year = yearMatch
              ? parseInt(yearMatch[1], 10)
              : new Date(f.createdAt).getFullYear();
            const doc = {
              id: f.fileId,
              title: f.name,
              type: f.name.split(".").pop().toLowerCase(),
              year,
              date: f.createdAt.split("T")[0],
              url: f.url,
              folderPath: f.folderPath || `/${folder}`,
              name: f.name
            };
            console.log('Processed document:', doc);
            return doc;
          })
          .sort((a, b) => a.title.localeCompare(b.title));

        console.log('Final documents array:', docs);
        setDocuments(docs);
      } catch (err) {
        setError("Failed to load documents.");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [folder, showSubfolderFilter]);

  // Get document counts for each folder based on current filters
  const getFolderDocumentCounts = useMemo(() => {
    const counts = {};
    
    const baseFilteredDocs = documents.filter(doc => {
      const matchesType = typeFilter === "all" || doc.type === typeFilter;
      const matchesYear = yearFilter === "all" || doc.year === Number(yearFilter);
      const matchesSearch = search === "" || doc.title.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesYear && matchesSearch;
    });
    
    baseFilteredDocs.forEach(doc => {
      const folder = subfolders.find(folder => 
        doc.folderPath?.toLowerCase().includes(folder.toLowerCase()) || 
        doc.url?.toLowerCase().includes(folder.toLowerCase().replace(/ /g, '%20'))
      );
      
      if (folder) {
        counts[folder] = (counts[folder] || 0) + 1;
      }
    });
    
    return counts;
  }, [documents, subfolders, typeFilter, yearFilter, search]);

  // Filter documents based on selected category and other filters
  const getFilteredDocuments = () => {
    if (showSubfolderFilter && subfolderFilter !== "all") {
      return documents.filter(doc => {
        const inFolder = 
          doc.folderPath?.toLowerCase().includes(subfolderFilter.toLowerCase()) || 
          doc.url?.toLowerCase().includes(subfolderFilter.toLowerCase().replace(/ /g, '%20'));
        
        if (!inFolder) return false;
        
        const matchesType = typeFilter === "all" || doc.type === typeFilter;
        const matchesYear = yearFilter === "all" || doc.year === Number(yearFilter);
        const matchesSearch = search === "" || doc.title.toLowerCase().includes(search.toLowerCase());
        
        return matchesType && matchesYear && matchesSearch;
      });
    }
    
    return documents.filter(doc => {
      const matchesType = typeFilter === "all" || doc.type === typeFilter;
      const matchesYear = yearFilter === "all" || doc.year === Number(yearFilter);
      const matchesSearch = search === "" || doc.title.toLowerCase().includes(search.toLowerCase());
      
      return matchesType && matchesYear && matchesSearch;
    });
  };

  const filteredDocuments = getFilteredDocuments();
  const showDocumentGrid = !loading && !error;
  const years = Array.from(new Set(documents.map(doc => doc.year))).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-normal text-[#28A8E0] mb-4">
          {title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
      </div>

      {/* Categories Accordion */}
      {showSubfolderFilter && (
        <div className="space-y-2">
          <div className="w-full">
            <button
              onClick={() => setSubfolderFilter("all")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                subfolderFilter === "all"
                  ? "bg-[#28A8E0] text-white"
                  : mode === "dark"
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <span>All Categories</span>
              <span className="text-xs opacity-70">
                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'item' : 'items'}
              </span>
            </button>
          </div>
          
          <div className="space-y-2">
            {subfolders.map((folder) => {
              const isExpanded = subfolderFilter === folder;
              const folderDocCount = getFolderDocumentCounts[folder] || 0;
              
              const filteredDocs = isExpanded 
                ? filteredDocuments.filter(doc => 
                    doc.folderPath?.toLowerCase().includes(folder.toLowerCase()) || 
                    doc.url?.toLowerCase().includes(folder.toLowerCase().replace(/ /g, '%20'))
                  )
                : [];
              
              return (
                <div key={folder} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSubfolderFilter(isExpanded ? "all" : folder)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors ${
                      isExpanded
                        ? 'bg-[#28A8E0] text-white'
                        : mode === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon 
                        icon="heroicons:chevron-down-20-solid"
                        className={`w-5 h-5 mr-2 transition-transform duration-200 ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`}
                      />
                      <span>{folder}</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-opacity-30 bg-white">
                      {folderDocCount} {folderDocCount === 1 ? 'item' : 'items'}
                    </span>
                  </button>
                  
                  <div 
                    className={`${
                      mode === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    } transition-all duration-200 overflow-hidden`}
                    style={{
                      maxHeight: isExpanded ? 'none' : '0',
                      padding: isExpanded ? '0.75rem' : '0',
                      borderTop: isExpanded ? '1px solid rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {isExpanded && (
                      <div className="p-3">
                        <DocumentGridComponent
                          documents={filteredDocs}
                          mode={mode}
                          onViewDoc={handleViewDoc}
                          onDownloadDoc={handleDownloadDoc}
                          emptyMessage="No documents found in this category matching your filters."
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Grid - Show all documents when no specific folder is selected */}
      {!loading && !error && subfolderFilter === "all" && (
        <DocumentGridComponent
          documents={filteredDocuments}
          mode={mode}
          onViewDoc={handleViewDoc}
          onDownloadDoc={handleDownloadDoc}
        />
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