import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';
import { listAllFilesByPrefix } from '@/utils/imageKitService';
import SimpleModal from './SimpleModal';
import toast from 'react-hot-toast';

const WorkingGroupDocumentation = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout, isPendingApproval }) => {
    const { user } = useUser();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const handleButtonClick = (e) => {
        if (isPendingApproval) {
            e.preventDefault();
            e.stopPropagation();
            toast.error('Your account is pending approval. Content will be available once your account is approved.', {
                duration: 4000,
                position: 'top-center',
            });
            return false;
        }
    };

    useEffect(() => {
        const fetchDocs = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('Fetching all working group files');
                const files = await listAllFilesByPrefix('/WorkingGroups');
                
                const docs = files
                    .filter(f => {
                        const ext = f.name.split('.').pop().toLowerCase();
                        const isValid = ['pdf', 'docx'].includes(ext);
                        if (!isValid) {
                            console.log('Skipping file with unsupported extension:', f.name);
                        }
                        return isValid;
                    })
                    .map(f => {
                        // Extract category from folder path or use 'General' as default
                        const category = f.folderPath 
                            ? f.folderPath.split('/').pop() 
                            : 'General';
                            
                        return {
                            id: f.fileId,
                            name: f.name,
                            category: category || 'General',
                            url: f.url,
                            type: f.name.split('.').pop().toLowerCase(),
                            folderPath: f.folderPath
                        };
                    });
                
                console.log('Processed documents:', docs);
                setDocuments(docs);
            } catch (e) {
                console.error('Error fetching documents:', e);
                setError('Failed to load documents. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchDocs();
    }, []);

    return (
        <main
            className={`transition-all duration-300 shadow-md hover:shadow-none rounded-xl overflow-hidden ${
                mode === 'dark'
                    ? 'border-[#8DC63F] bg-[#19506a] text-white' // Dark mode - dark teal background, white text
                    : 'border-gray-300 bg-white text-black' // Light mode - white background, black text
            } h-full`}
        >
            <div className="flex flex-col justify-between p-8 h-full">  {/* Full height for content */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`font-bold text-xl ${mode === 'dark' ? 'text-white' : 'text-black'}`}>Working Group Documentation</h3>
                    {!loading && !error && documents.length > 0 && (
                        <div className="text-sm text-gray-500">
                            Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Table section */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white mb-14">
                        <thead>
                        <tr className={`bg-sky-500 text-white`}>
                            <th className="px-6 py-6 text-left border-r " style={{borderColor: '#E2E2E2'}}>Document Name</th>
                            <th className="px-6 py-6 text-center border-r" style={{borderColor: '#E2E2E2'}}>Category</th>
                            <th className="px-6 py-6 text-center border-r" style={{borderColor: '#E2E2E2'}}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="text-center py-8 text-gray-400">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={3} className="text-center py-8 text-red-500">{error}</td></tr>
                        ) : documents.length === 0 ? (
                            <tr><td colSpan={3} className="text-center py-8 text-gray-400">No documents found.</td></tr>
                        ) : (
                            documents.map((doc, index) => (
                                <tr
                                    key={doc.id}
                                    className={`transition-all duration-300 hover:bg-[#0f445e] hover:text-white ${
                                        mode === 'dark'
                                            ? index % 2 === 0
                                                ? 'bg-[#266380]'
                                                : 'bg-[#19506a]'
                                            : index % 2 !== 0
                                                ? 'bg-sky-50 hover:bg-sky-300'
                                                : 'bg-white hover:bg-sky-300'
                                    }`}
                                >
                                    <td className="px-6 py-6 border-b border-r" style={{borderColor: '#E2E2E2'}}>{doc.name}</td>
                                    <td className="px-6 py-6 text-center border-b border-r" style={{borderColor: '#E2E2E2'}}>{doc.category}</td>
                                    <td className="flex px-6 py-6 border-b" style={{borderColor: '#E2E2E2'}}>
                                        <div className="flex gap-4 w-full">
                                            <button
                                                onClick={isPendingApproval ? handleButtonClick : () => { setSelectedDoc(doc); setModalOpen(true); }}
                                                disabled={isPendingApproval}
                                                className={`flex items-center transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white text-base font-normal px-4 py-2 rounded-full hover:translate-y-[-5px] w-1/2 justify-center
                                                    ${isPendingApproval ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Icon icon="mdi:eye-circle" className="text-2xl mr-2"/> View
                                            </button>
                                            <button
                                                onClick={isPendingApproval ? handleButtonClick : () => window.open(doc.url, '_self')}
                                                disabled={isPendingApproval}
                                                className={`flex items-center transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white text-base font-normal px-4 py-2 rounded-full hover:translate-y-[-5px] w-1/2 justify-center
                                                    ${isPendingApproval ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Icon icon="akar-icons:download" className="text-2xl mr-2"/> Download
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {isPendingApproval ? (
                    <button
                        onClick={handleButtonClick}
                        disabled={isPendingApproval}
                        className="transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-center rounded-full hover:translate-y-[-5px] mt-auto text-center block opacity-50 cursor-not-allowed"
                    >
                        View All Documents
                    </button>
                ) : (
                    <button
                        onClick={() => window.open('/working-group-docs', '_self')}
                        className="transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-center rounded-full hover:translate-y-[-5px] mt-auto text-center block"
                    >
                        View All Documents
                    </button>
                )}
            </div>
            <SimpleModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedDoc(null); }}
                title={selectedDoc ? selectedDoc.name : ''}
                mode={mode}
                width="max-w-4xl"
            >
                {selectedDoc && selectedDoc.type === 'pdf' ? (
                    <iframe
                        src={selectedDoc.url}
                        title={selectedDoc.name}
                        className="w-full h-[70vh] rounded-xl border"
                    />
                ) : selectedDoc && selectedDoc.type === 'docx' ? (
                    <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedDoc.url)}&embedded=true`}
                        title={selectedDoc.name}
                        className="w-full h-[70vh] rounded-xl border bg-white"
                    />
                ) : null}
            </SimpleModal>
        </main>
    );
};

export default WorkingGroupDocumentation;
