import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';
import { listFilesInFolder } from '@/utils/imageKitService';
import Link from 'next/link';
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
                const files = await listFilesInFolder('/WorkingGroups');
                const docs = files.filter(f => {
                    const ext = f.name.split('.').pop().toLowerCase();
                    return ext === 'pdf' || ext === 'docx';
                }).map(f => ({
                    name: f.name,
                    category: f.folder ? f.folder.split('/').pop() : 'General',
                    url: f.url,
                    id: f.fileId,
                    type: f.name.split('.').pop().toLowerCase(),
                }));
                setDocuments(docs);
            } catch (e) {
                setError('Failed to load documents.');
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
                <h3 className={`font-bold text-xl mb-4 ${mode === 'dark' ? 'text-white' : 'text-black'}`}>Working Group Documentation</h3>

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
                                                onClick={isPendingApproval ? handleButtonClick : () => window.open(doc.url, '_blank')}
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
                    <Link href="/working-group-docs" legacyBehavior>
                        <a className="transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-center rounded-full hover:translate-y-[-5px] mt-auto text-center block">
                            View All Documents
                        </a>
                    </Link>
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
