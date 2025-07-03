import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';
import { listFilesInFolder } from '@/utils/imageKitService';
import Link from 'next/link';
import SimpleModal from './SimpleModal';

const WorkingGroupDocumentation = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout }) => {
    const { user } = useUser();
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
                                                className="flex items-center transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white text-base font-normal px-4 py-2 rounded-full hover:translate-y-[-5px] w-1/2 justify-center"
                                                onClick={() => { setSelectedDoc(doc); setModalOpen(true); }}
                                            >
                                                <Icon icon="mdi:eye-circle" className="text-2xl mr-2"/> View
                                            </button>
                                            <a
                                                href={doc.url}
                                                download
                                                className="flex items-center transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white text-base font-normal px-4 py-2 rounded-full hover:translate-y-[-5px] w-1/2 justify-center"
                                            >
                                                <Icon icon="akar-icons:download" className="text-2xl mr-2"/> Download
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <Link href="/working-group-docs" legacyBehavior>
                    <a className="transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-center rounded-full hover:translate-y-[-5px] mt-auto text-center block">
                        View All Documents
                    </a>
                </Link>
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
    );
};

export default WorkingGroupDocumentation;
