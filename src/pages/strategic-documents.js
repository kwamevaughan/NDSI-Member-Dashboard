import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import toast from 'react-hot-toast';
import useSidebar from '@/hooks/useSidebar';
import { useUser } from '@/context/UserContext';
import useSignOut from '@/hooks/useSignOut';
import { listFilesInFolder } from '@/utils/imageKitService';
import SimpleModal from '@/components/SimpleModal';
import DocumentGrid from '@/components/DocumentGrid';
import { useTheme } from '@/hooks/useTheme';

// Accept mode and toggleMode as props
const StrategicDocumentsPage = () => {
    const router = useRouter();
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
    const { mode, toggleMode } = useTheme();

    // Check if user is pending approval
    useEffect(() => {
        if (user && !user.is_approved) {
            toast.error('Your account is pending approval. Content will be available once your account is approved.', {
                duration: 4000,
                position: 'top-center',
            });
            router.replace('/dashboard');
        }
    }, [user, router]);

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

    // Don't render if user is pending approval
    if (user && !user.is_approved) {
        return null;
    }

    return (
      <div
        className={`flex flex-col h-screen ${
          mode === "dark" ? "bg-[#1a1a1a]" : "bg-[#f7f1eb]"
        }`}
      >
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
            className={`flex-1 transition-margin duration-300 ${
              isSidebarOpen ? "lg:ml-[250px]" : "ml-0 lg:ml-[80px]"
            }`}
          >
            <main
              className={`p-4 md:p-8 mt-10 ${
                isSidebarOpen
                  ? "pt-[60px] md:pt-[70px]"
                  : "pt-[80px] md:pt-[120px]"
              } ${
                mode === "dark"
                  ? "bg-[#0a0c1d] text-white"
                  : "bg-[#ececec] text-black"
              } w-full min-h-screen`}
            >
              <DocumentGrid
                folder="StrategicDocs"
                title="Strategic Documents"
                description="Browse and filter strategic documents below."
                mode={mode}
              />
            </main>
          </div>
        </div>
      </div>
    );
};

export default StrategicDocumentsPage;