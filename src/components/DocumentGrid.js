import { useState, useEffect } from 'react';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
import SimpleModal from '@/components/SimpleModal';
import { listFilesInFolder, listSubfoldersInFolder, listAllFilesRecursively, listAllFilesByPrefix } from '@/utils/imageKitService';

// Utility function to truncate text
function truncateText(text, maxLength = 20) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + '…';
}

const DocumentGrid = ({ folder, title, description = 'Browse and filter documents below.', mode, showSubfolderFilter = false }) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [subfolders, setSubfolders] = useState([]);
    const [subfolderFilter, setSubfolderFilter] = useState('all');

    // Fetch subfolders if enabled
    useEffect(() => {
        if (!showSubfolderFilter) return;
        const fetchSubfolders = async () => {
            try {
                const folders = await listSubfoldersInFolder(`/${folder}`);
                setSubfolders(folders);
            } catch (e) {
                setSubfolders([]);
            }
        };
        fetchSubfolders();
    }, [folder, showSubfolderFilter]);

    // Fetch documents (from folder or subfolder)
    useEffect(() => {
        const fetchDocs = async () => {
            setLoading(true);
            setError(null);
            try {
                let docsRaw = [];
                if (showSubfolderFilter && subfolderFilter === 'all') {
                    // Use prefix-based fetch to get all files in folder and subfolders
                    docsRaw = await listAllFilesByPrefix(`/${folder}`);
                } else {
                    let fetchPath = `/${folder}`;
                    if (showSubfolderFilter && subfolderFilter !== 'all') {
                        fetchPath = `/${folder}/${subfolderFilter}`;
                    }
                    docsRaw = await listFilesInFolder(fetchPath);
                }
                const docs = docsRaw.filter(f => {
                    const ext = f.name.split('.').pop().toLowerCase();
                    return ext === 'pdf' || ext === 'docx';
                }).map(f => {
                    const yearMatch = f.name.match(/^(\d{4})\s*[-_]/);
                    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date(f.createdAt).getFullYear();
                    return {
                        id: f.fileId,
                        title: f.name,
                        type: f.name.split('.').pop().toLowerCase(),
                        year,
                        date: f.createdAt.split('T')[0],
                        url: f.url,
                    };
                });
                setDocuments(docs);
            } catch (e) {
                setError('Failed to load documents.');
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, [folder, showSubfolderFilter, subfolderFilter]);

    const years = [...new Set(documents.map(doc => doc.year))];

    const filteredDocuments = documents.filter(doc => {
        const matchesType = typeFilter === 'all' || doc.type === typeFilter;
        const matchesYear = yearFilter === 'all' || doc.year === Number(yearFilter);
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesYear && matchesSearch;
    });

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#28A8E0] mb-2">
            {title}
          </h2>
          <p className="text-base text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-2">
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-2/6 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#28A8E0] bg-white text-black dark:bg-[#101720] dark:text-white dark:border-gray-700"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 bg-white text-black dark:bg-[#101720] dark:text-white dark:border-gray-700"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 bg-white text-black dark:bg-[#101720] dark:text-white dark:border-gray-700"
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
              className="w-2/6 rounded-md border border-gray-300 px-3 py-2 bg-white text-black dark:bg-[#101720] dark:text-white dark:border-gray-700"
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
        {loading ? (
          <div className="flex justify-center items-center py-20 text-lg text-gray-400">
            Loading documents...
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-20 text-lg text-red-500">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-12">
                No documents found.
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex flex-col items-center p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out ${
                    mode === "dark"
                      ? "bg-[#101720] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  <div className="mb-4">
                    {doc.type === "pdf" ? (
                      <FaFilePdf className="text-5xl text-red-500" />
                    ) : (
                      <FaFileWord className="text-5xl text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center text-center">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {truncateText(doc.title)}
                    </h3>
                    <span className="text-xs text-gray-400 mb-2">
                      {doc.type.toUpperCase()} &bull; {doc.year}
                    </span>
                    <span className="text-xs text-gray-400 mb-4">
                      Uploaded: {doc.date}
                    </span>
                  </div>
                  <button
                    className="mt-auto w-full bg-[#28A8E0] hover:bg-[#8dc63f] text-white font-semibold py-2 rounded-lg transition-colors duration-200 text-center"
                    onClick={() => {
                      setSelectedDoc(doc);
                      setModalOpen(true);
                    }}
                  >
                    View Document
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        <SimpleModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedDoc(null);
          }}
          title={selectedDoc ? selectedDoc.title : ""}
          mode={mode}
          width="max-w-5xl"
        >
          {selectedDoc && selectedDoc.type === "pdf" ? (
            <iframe
              src={selectedDoc.url}
              title={selectedDoc.title}
              className="w-full h-[70vh] rounded-xl border"
            />
          ) : selectedDoc && selectedDoc.type === "docx" ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <p className="mb-4">
                DOCX preview is not supported. You can download the file below:
              </p>
              <a
                href={selectedDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#28A8E0] hover:bg-[#0CB4AB] text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Download DOCX
              </a>
            </div>
          ) : null}
        </SimpleModal>
      </div>
    );
};

export default DocumentGrid; 