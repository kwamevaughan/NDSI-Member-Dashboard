import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import toast from 'react-hot-toast';
import useTheme from '@/hooks/useTheme';
import useSidebar from '@/hooks/useSidebar';
import { useUser } from '@/context/UserContext';
import useSignOut from '@/hooks/useSignOut';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
import { listFilesInFolder } from '@/utils/imageKitService';
import SimpleModal from '@/components/SimpleModal';

const StrategicDocumentsPage = () => {
    const router = useRouter();
    const { mode, toggleMode } = useTheme();
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const notify = (message) => toast(message);
    const { handleSignOut } = useSignOut();
    const { user } = useUser();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        const fetchDocs = async () => {
            setLoading(true);
            setError(null);
            try {
                const files = await listFilesInFolder('/StrategicDocs');
                // Only keep PDF and DOCX
                const docs = files.filter(f => {
                    const ext = f.name.split('.').pop().toLowerCase();
                    return ext === 'pdf' || ext === 'docx';
                }).map(f => {
                    // Extract year from filename (e.g., '2023 - ...')
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
    }, []);

    const years = [...new Set(documents.map(doc => doc.year))];

    const filteredDocuments = documents.filter(doc => {
        const matchesType = typeFilter === 'all' || doc.type === typeFilter;
        const matchesYear = yearFilter === 'all' || doc.year === Number(yearFilter);
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesYear && matchesSearch;
    });

    return (
        <div className={`flex flex-col h-screen ${mode === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#f7f1eb]'}`}>
            <Header
                isSidebarOpen={isSidebarOpen}
                mode={mode}
                toggleMode={toggleMode}
                onLogout={handleSignOut}
            />
            <div className="flex flex-1">
                <Sidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    mode={mode}
                    onLogout={handleSignOut}
                    toggleMode={toggleMode}
                />
                <div
                    className={`flex-1 transition-margin duration-300 pt-20 ${
                        isSidebarOpen ? 'lg:ml-[300px]' : 'ml-0 lg:ml-[80px]'
                    }`}
                >
                    <main
                        className={`p-4 md:p-8 ${
                            isSidebarOpen
                                ? 'pt-[60px] md:pt-[70px]'
                                : 'pt-[80px] md:pt-[120px]'
                        } ${mode === 'dark' ? 'bg-[#0a0c1d] text-white' : 'bg-[#ececec] text-black'} w-full min-h-screen`}
                    >
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-semibold text-[#28A8E0] mb-2">Strategic Documents</h2>
                                    <p className="text-base text-gray-500 dark:text-gray-400">Browse and filter strategic documents below.</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#28A8E0] bg-white text-black dark:bg-[#101720] dark:text-white dark:border-gray-700"
                                    />
                                    <select
                                        value={typeFilter}
                                        onChange={e => setTypeFilter(e.target.value)}
                                        className="rounded-md border border-gray-300 px-3 py-2 bg-white text-black dark:bg-[#101720] dark:text-white dark:border-gray-700"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="pdf">PDF</option>
                                        <option value="docx">DOCX</option>
                                    </select>
                                    <select
                                        value={yearFilter}
                                        onChange={e => setYearFilter(e.target.value)}
                                        className="rounded-md border border-gray-300 px-3 py-2 bg-white text-black dark:bg-[#101720] dark:text-white dark:border-gray-700"
                                    >
                                        <option value="all">All Years</option>
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {loading ? (
                                <div className="flex justify-center items-center py-20 text-lg text-gray-400">Loading documents...</div>
                            ) : error ? (
                                <div className="flex justify-center items-center py-20 text-lg text-red-500">{error}</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredDocuments.length === 0 ? (
                                        <div className="col-span-full text-center text-gray-400 py-12">No documents found.</div>
                                    ) : (
                                        filteredDocuments.map(doc => (
                                            <div
                                                key={doc.id}
                                                className={`flex flex-col items-center p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out ${mode === 'dark' ? 'bg-[#101720] text-white' : 'bg-white text-black'}`}
                                            >
                                                <div className="mb-4">
                                                    {doc.type === 'pdf' ? (
                                                        <FaFilePdf className="text-5xl text-red-500" />
                                                    ) : (
                                                        <FaFileWord className="text-5xl text-blue-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col items-center text-center">
                                                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">{doc.title}</h3>
                                                    <span className="text-xs text-gray-400 mb-2">{doc.type.toUpperCase()} &bull; {doc.year}</span>
                                                    <span className="text-xs text-gray-400 mb-4">Uploaded: {doc.date}</span>
                                                </div>
                                                <button
                                                    className="mt-auto w-full bg-[#28A8E0] hover:bg-[#0CB4AB] text-white font-semibold py-2 rounded-lg transition-colors duration-200 text-center"
                                                    onClick={() => { setSelectedDoc(doc); setModalOpen(true); }}
                                                >
                                                    View Document
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <SimpleModal
                            isOpen={modalOpen}
                            onClose={() => { setModalOpen(false); setSelectedDoc(null); }}
                            title={selectedDoc ? selectedDoc.title : ''}
                            mode={mode}
                            width="max-w-4xl"
                        >
                            {selectedDoc && selectedDoc.type === 'pdf' ? (
                                <iframe
                                    src={selectedDoc.url}
                                    title={selectedDoc.title}
                                    className="w-full h-[70vh] rounded-xl border"
                                />
                            ) : selectedDoc && selectedDoc.type === 'docx' ? (
                                <div className="flex flex-col items-center justify-center min-h-[40vh]">
                                    <p className="mb-4">DOCX preview is not supported. You can download the file below:</p>
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
                    </main>
                </div>
            </div>
        </div>
    );
};

export default StrategicDocumentsPage;