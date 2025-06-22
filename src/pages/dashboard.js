import { useRouter } from 'next/router';
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import { toast } from 'react-toastify';
import useTheme from '@/hooks/useTheme';
import useSidebar from '@/hooks/useSidebar';
import useSignOut from '@/hooks/useSignOut';
import { useUser } from '@/context/UserContext';
import StrategicDocuments from '@/components/StrategicDocuments';
import TrainingMaterials from "@/components/TrainingMaterials";
import ESGToolkit from "@/components/ESGToolkit";
import Newsletter from "@/components/Newsletter";
import WorkingGroupDocumentation from "@/components/WorkingGroupDocumentation";

const Dashboard = () => {
    const router = useRouter();
    const { mode, toggleMode } = useTheme();
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const notify = (message) => toast(message);
    const { handleSignOut } = useSignOut();
    const { user } = useUser();

    const firstName = user?.first_name || 'Guest';

    return (
        <div className={`flex flex-col h-full ${mode === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#f7f1eb]'}`}>
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
                        isSidebarOpen ? 'lg:ml-[300px]' : 'ml-0 lg:ml-[80px]'
                    }`}
                >
                    <main
                        className={`p-4 md:p-8 ${
                            isSidebarOpen
                                ? 'pt-[60px] md:pt-[70px]'
                                : 'pt-[80px] md:pt-[120px]' // Increased padding when sidebar is hidden
                        } ${mode === 'dark' ? 'bg-[#0a0c1d] text-white' : 'bg-[#ececec] text-black'} w-full min-h-screen`}
                    >
                        <div className="space-y-6 ">
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                                    <div
                                        className={`${mode === 'dark' ? 'bg-[#101720] text-white' : 'bg-white text-black'} rounded-lg hover:shadow-md transition-all duration-300 ease-in-out`}></div>
                                    <div
                                        className={`${mode === 'dark' ? 'bg-[#101720] text-white' : 'bg-[#0CB4AB] text-black'} rounded-lg hover:shadow-md transition-all duration-300 ease-in-out`}></div>
                                </div>
                            </div>
                            <h2 className="text-4xl font-bold text-[#28A8E0] mb-4">Welcome {firstName} to NDSI!</h2>
                            <p className="mb-4">Explore resources, training, and key strategic documents to support
                                sustainability efforts.</p>
                        </div>

                        <div className="grid pt-14 pb-14 gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 h-full">
                            <div className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300">
                                <StrategicDocuments
                                mode={mode}/>
                            </div>
                            <div className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300">
                                <TrainingMaterials
                                    mode={mode}/>
                            </div>
                            <div className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300">
                                <ESGToolkit
                                    mode={mode}/>
                            </div>
                            <div className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300">
                                <Newsletter
                                    mode={mode}/>
                            </div>
                        </div>

                        <div className="grid pb-14 gap-8 grid-cols-1 h-full">
                            <div className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300">
                                <WorkingGroupDocumentation
                                    mode={mode}/>
                            </div>

                        </div>


                    </main>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;