import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSavedPulses, savePulse } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import NotificationTray from '../components/NotificationTray';
import Avatar from '../components/Avatar';

const SavedPosts = () => {
    const [savedPulses, setSavedPulses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursorHistory, setCursorHistory] = useState([null]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        const loadSaved = async () => {
            try {
                setLoading(true);
                const currentCursor = cursorHistory[currentIndex];
                const { data } = await fetchSavedPulses(currentCursor);
                setSavedPulses(data.data.posts);
                setNextCursor(data.data.nextCursor);
            } catch (err) {
                toast.error("Failed to load your library");
            } finally {
                setLoading(false);
            }
        };
        loadSaved();
    }, [currentIndex]);

    const handleNext = () => {
        if (nextCursor) {
            setCursorHistory(prev => {
                const newHistory = [...prev];
                newHistory[currentIndex + 1] = nextCursor;
                return newHistory;
            });
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleRemoveSaved = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Remove this pulse from your library?")) return;
        try {
            await savePulse(id);
            setSavedPulses(prev => prev.filter(p => p._id !== id));
            toast.success("Removed from library");
        } catch (err) {
            toast.error("Failed to remove pulse");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F7F4] flex font-['Instrument_Sans']">
            
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-[#F1EFEA] border-r border-[#E8E4DF] flex flex-col p-8 fixed h-full z-10">
                <div className="mb-12">
                    <div className="flex items-center space-x-3 text-[#2C3330]" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-[#2C3330] rounded-full"></div>
                            <div className="w-2 h-2 bg-[#2C3330] rounded-full -ml-1 mt-1.5"></div>
                            <div className="w-2 h-2 bg-[#2C3330] rounded-full -ml-1"></div>
                        </div>
                        <h1 className="text-lg font-black tracking-tighter uppercase font-sans">PULSE-POST</h1>
                    </div>
                </div>

                <nav className="space-y-3 flex-1">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-3 w-full px-5 py-3 rounded-2xl text-[#707774] hover:bg-white/50 transition-all">
                        <span className="text-sm font-bold">Dashboard</span>
                    </button>
                    <button onClick={() => navigate('/my-pulses')} className="flex items-center space-x-3 w-full px-5 py-3 rounded-2xl text-[#707774] hover:bg-white/50 transition-all">
                        <span className="text-sm font-bold">My Pulses</span>
                    </button>
                    <button onClick={() => navigate('/dashboard', { state: { activeTab: 'Explore' } })} className="flex items-center space-x-3 w-full px-5 py-3 rounded-2xl text-[#707774] hover:bg-white/50 transition-all">
                        <span className="text-sm font-bold">Explore</span>
                    </button>
                    <button className="flex items-center space-x-3 w-full px-5 py-3 rounded-2xl bg-[#526D62] text-white shadow-lg transition-all">
                        <span className="text-sm font-bold">Saved Posts</span>
                    </button>
                    <button onClick={() => navigate('/dashboard', { state: { activeTab: 'Settings' } })} className="flex items-center space-x-3 w-full px-5 py-3 rounded-2xl text-[#707774] hover:bg-white/50 transition-all">
                        <span className="text-sm font-bold">Settings</span>
                    </button>
                </nav>

                <button onClick={logout} className="mt-auto px-5 py-3 text-sm font-bold text-[#707774] hover:text-red-500 text-left transition-colors">
                    Log Out
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="ml-64 flex-1 flex flex-col">
                <div className="px-12 py-12 border-b border-[#E8E4DF]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-4xl font-bold text-[#2C3330] tracking-tight">Saved Posts</h2>
                            <p className="text-[#707774] mt-1 text-lg">Curated stories you've saved for later.</p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <NotificationTray />
                            <Avatar src={user?.avatar} name={user?.name} className="w-12 h-12 rounded-full border-2 border-[#E8E4DF] object-cover" />
                        </div>
                    </div>
                </div>

                <div className="px-12 py-10">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#526D62]/20 border-t-[#526D62] rounded-full animate-spin"></div>
                        </div>
                    ) : savedPulses.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-[#E8E4DF]">
                            <p className="text-[#707774] font-medium italic">
                                {currentIndex > 0 ? "No more saved posts here." : "Your library is empty. Discover pulses and save them here."}
                            </p>
                            {currentIndex === 0 && (
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="mt-6 px-8 py-3 bg-[#526D62] text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#43594f] transition-all"
                                >
                                    Browse Feed
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {savedPulses.map((pulse) => (
                                    <div 
                                        key={pulse._id}
                                        onClick={() => navigate(`/post/${pulse._id}`)}
                                        className="group aspect-square relative rounded-[2.5rem] overflow-hidden border border-[#E8E4DF] shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer"
                                    >
                                        <img 
                                            src={pulse.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000'} 
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            alt={pulse.title} 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        
                                        <button 
                                            onClick={(e) => handleRemoveSaved(pulse._id, e)}
                                            className="absolute top-6 right-6 bg-red-500/80 backdrop-blur-sm p-2.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg z-10"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M17.25 17.25A2.25 2.25 0 0 1 15 19.5H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>

                                        <div className="absolute inset-0 p-8 flex flex-col justify-end z-0">
                                            <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                                        {pulse.category}
                                                    </span>
                                                </div>
                                                <h4 className="text-white text-lg font-bold leading-tight line-clamp-2">
                                                    {pulse.title}
                                                </h4>
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Avatar src={pulse.author?.avatar} name={pulse.author?.name} className="w-5 h-5 rounded-full object-cover" />
                                                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{pulse.author?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            ))}
                            </div>

                            {(currentIndex > 0 || nextCursor) && (
                                <div className="flex items-center justify-center space-x-6 pt-8 border-t border-[#E8E4DF]">
                                    <button 
                                        onClick={handlePrev}
                                        disabled={currentIndex === 0}
                                        className="px-6 py-3 rounded-2xl border border-[#E8E4DF] text-xs font-bold uppercase tracking-widest text-[#2C3330] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs font-bold text-[#707774] uppercase tracking-widest">
                                        Page {currentIndex + 1}
                                    </span>
                                    <button 
                                        onClick={handleNext}
                                        disabled={!nextCursor}
                                        className="px-6 py-3 rounded-2xl border border-[#E8E4DF] text-xs font-bold uppercase tracking-widest text-[#2C3330] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SavedPosts;
