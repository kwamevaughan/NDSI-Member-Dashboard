import React from 'react';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const StrategicDocuments = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout, isPendingApproval }) => {
    const { user } = useUser();

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

    return (
        <main
            className={`transition-all duration-300 shadow-md hover:shadow-none rounded-xl overflow-hidden ${
                mode === 'dark'
                    ? 'border-[#8DC63F] bg-[#19506a] text-white'  // Dark mode - dark teal background, white text
                    : 'border-gray-300 bg-white text-black'    // Light mode - white background, black text
            } h-full`}  // Full height for the container
        >
            <div className="flex flex-col justify-between p-8 h-full">  {/* Full height for content */}
                <div className="mb-4">
                    <Icon icon="fe:document" className={`text-5xl ${mode === 'dark' ? 'text-sky-400' : 'text-sky-500'}`}/>
                </div>
                <h3 className={`font-semibold text-xl mb-4 ${mode === 'dark' ? 'text-white' : 'text-black'}`}>NDSI Strategic Documents</h3>
                <p className={`mb-6 ${mode === 'dark' ? 'text-white' : 'text-black'}`}>Access key documents including the NDSI Charter, strategy, and official logos.</p>
                {/* <Link href="/" */}
                                {isPendingApproval ? (
                <button
                    onClick={handleButtonClick}
                    disabled={isPendingApproval}
                    className={`transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-end rounded-full hover:translate-y-[-5px] 
                        ${mode === 'dark' ? 'hover:bg-sky-400' : 'hover:bg-sky-600'}
                        ${isPendingApproval ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    View Documents
                </button>
            ) : (
                <button
                    onClick={() => window.open('/strategic-documents', '_self')}
                    disabled={isPendingApproval}
                    className={`transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-end rounded-full hover:translate-y-[-5px] 
                        ${mode === 'dark' ? 'hover:bg-sky-400' : 'hover:bg-sky-600'}
                        ${isPendingApproval ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    View Documents
                </button>
            )}
            </div>
        </main>
    );
};

export default StrategicDocuments;
