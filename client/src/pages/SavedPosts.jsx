import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSavedPulses, toggleLike } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import NotificationTray from '../components/NotificationTray';

const SavedPosts = () => {
    const [savedPulses, setSavedPulses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        const loadSaved = async () => {
            try {
                const { data } = await fetchSavedPulses();
                setSavedPulses(data.data);
            } catch (err) {
                toast.error("Failed to load your library");
            } finally {
                setLoading(false);
            }
        };
        loadSaved();
    }, []);

    const handleHeart = async (id, e) => {
        e.stopPropagation();
        try {
            const { data } = await toggleLike(id);
            setSavedPulses(prev => prev.map(p => 
                p._id === id ? { ...p, likes: data.data.likes } : p
            ));
        } catch (err) {
            toast.error("Failed to heart pulse");
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
                        <span className="text-sm font-bold">Feed</span>
                    </button>
                    <button className="flex items-center space-x-3 w-full px-5 py-3 rounded-2xl bg-[#526D62] text-white shadow-lg transition-all">
                        <span className="text-sm font-bold">Library</span>
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard', { state: { activeTab: 'Settings' } })} 
                        className="flex items-center space-x-3 w-full px-5 py-3 rounded-2xl text-[#707774] hover:bg-white/50 transition-all"
                    >
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
                            <h2 className="text-4xl font-bold text-[#2C3330] tracking-tight">Your Library</h2>
                            <p className="text-[#707774] mt-1 text-lg">Curated stories you've saved for later.</p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <NotificationTray />
                            <img src={user?.avatar} className="w-12 h-12 rounded-full border-2 border-[#E8E4DF] object-cover" />
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
                            <p className="text-[#707774] font-medium italic">Your library is empty. Discover pulses and save them here.</p>
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="mt-6 px-8 py-3 bg-[#526D62] text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#43594f] transition-all"
                            >
                                Browse Feed
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {savedPulses.map((pulse) => (
                                <div 
                                    key={pulse._id}
                                    onClick={() => navigate(`/post/${pulse._id}`)}
                                    className="bg-white rounded-[2.5rem] overflow-hidden border border-[#E8E4DF] hover:shadow-2xl transition-all group cursor-pointer"
                                >
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={pulse.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#526D62]">
                                            {pulse.category}
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <h3 className="text-xl font-bold mb-3 group-hover:text-[#526D62] transition-colors line-clamp-1">{pulse.title}</h3>
                                        <p className="text-[#707774] text-sm line-clamp-2 mb-6 leading-relaxed">{pulse.content}</p>
                                        
                                        <div className="flex items-center justify-between pt-6 border-t border-[#F1EFEA]">
                                            <div className="flex items-center space-x-3">
                                                <img src={pulse.author?.avatar} className="w-6 h-6 rounded-full" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#2C3330]">{pulse.author?.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <button 
                                                    onClick={(e) => handleHeart(pulse._id, e)}
                                                    className={`flex items-center space-x-1.5 ${pulse.likes?.includes(user?._id) ? 'text-[#EA4335]' : 'text-[#707774] hover:text-[#EA4335]'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill={pulse.likes?.includes(user?._id) ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                                    </svg>
                                                    <span className="text-[10px] font-bold">{pulse.likes?.length || 0}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SavedPosts;
