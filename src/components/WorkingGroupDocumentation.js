import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';

const WorkingGroupDocumentation = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout }) => {
    const { user } = useUser();

    // Dummy content for rows
    const documents = [
        {
            name: 'Risk Analysis Report 2024',
            category: 'Risk Management'
        },
        {
            name: 'Risk Analysis Report 2024',
            category: 'Risk Management'
        },
        {
            name: 'Risk Analysis Report 2024',
            category: 'Risk Management'
        },
        {
            name: 'Risk Analysis Report 2024',
            category: 'Risk Management'
        },
    ];

    return (
        <main
            className={`transition-all duration-300 shadow-md hover:shadow-none bg-white rounded-xl overflow-hidden ${
                mode === 'dark' ? 'border-[#8DC63F] bg-[#0a0c1d] text-white' : 'border-gray-300 bg-[#ececec] text-black'
            } h-full`}  // Add h-full to take full height
        >
            <div className="flex flex-col justify-between p-8 h-full">  {/* Add h-full to ensure full height */}

                <h3 className="main-gray font-bold text-xl mb-4">Working Group Documentation</h3>

                {/* Table section */}
                <table className="min-w-full bg-white mb-14">
                    <thead>
                    <tr className="bg-sky-500 text-white">
                        <th className="px-6 py-6 text-left border-r" style={{borderColor: '#E2E2E2'}}>Document Name</th>
                        <th className="px-6 py-6 text-center border-r" style={{borderColor: '#E2E2E2'}}>Category</th>
                        <th className="px-6 py-6 text-center border-r" style={{borderColor: '#E2E2E2'}}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {documents.map((doc, index) => (
                        <tr
                            key={index}
                            className={`transition-all duration-300 hover:bg-gray-200 ${index % 2 !== 0 ? 'bg-sky-50' : 'bg-white'}`}  // Ensure alternating background with hover
                        >
                            <td className="px-6 py-6 border-b border-r" style={{borderColor: '#E2E2E2'}}>{doc.name}</td>
                            <td className="px-6 py-6 text-center border-b border-r"
                                style={{borderColor: '#E2E2E2'}}>{doc.category}</td>
                            <td className="flex px-6 py-6 border-b" style={{borderColor: '#E2E2E2'}}>
                                <div className="flex gap-4 w-full">
                                    <button
                                        className="flex items-center transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white text-base font-normal px-4 py-2 rounded-full hover:translate-y-[-5px] w-1/2">
                                        <Icon icon="mdi:eye-circle" className="text-2xl mr-2"/> View  {/* Solid color eye icon */}
                                    </button>
                                    <button
                                        className="flex items-center transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white text-base font-normal px-4 py-2 rounded-full hover:translate-y-[-5px] w-1/2">
                                        <Icon icon="akar-icons:download" className="text-2xl mr-2"/> Download
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <button
                    className="transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-center rounded-full hover:translate-y-[-5px]"
                >
                    View All Documents
                </button>

            </div>
        </main>
    );
};

export default WorkingGroupDocumentation;
