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
            className={`transition-all duration-300 shadow-md hover:shadow-none rounded-xl overflow-hidden ${
                mode === 'dark'
                    ? 'border-[#8DC63F] bg-[#19506a] text-white' // Dark mode - dark teal background, white text
                    : 'border-gray-300 bg-white text-black' // Light mode - white background, black text
            } h-full`} // Full height for the container
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
                        {documents.map((doc, index) => (
                            <tr
                                key={index}
                                className={`transition-all duration-300 hover:bg-[#0f445e] hover:text-white ${
                                    mode === 'dark'
                                        ? index % 2 === 0
                                            ? 'bg-[#266380]' // Even rows in dark mode
                                            : 'bg-[#19506a]' // Odd rows in dark mode
                                        : index % 2 !== 0
                                            ? 'bg-sky-50 hover:bg-sky-300' // Even rows in light mode with hover effect (light grey)
                                            : 'bg-white hover:bg-sky-300' // Odd rows in light mode with hover effect (light grey)
                                }`}
                            >
                                <td className="px-6 py-6 border-b border-r" style={{borderColor: '#E2E2E2'}}>{doc.name}</td>
                                <td className="px-6 py-6 text-center border-b border-r" style={{borderColor: '#E2E2E2'}}>{doc.category}</td>
                                <td className="flex px-6 py-6 border-b" style={{borderColor: '#E2E2E2'}}>
                                    <div className="flex gap-4 w-full">
                                        <button
                                            className="flex items-center transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white text-base font-normal px-4 py-2 rounded-full hover:translate-y-[-5px] w-1/2"
                                        >
                                            <Icon icon="mdi:eye-circle" className="text-2xl mr-2"/> View
                                        </button>
                                        <button
                                            className="flex items-center transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white text-base font-normal px-4 py-2 rounded-full hover:translate-y-[-5px] w-1/2"
                                        >
                                            <Icon icon="akar-icons:download" className="text-2xl mr-2"/> Download
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

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
