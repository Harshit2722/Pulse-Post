import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPosts, deletePost, toggleLike, addComment, updateAccount, updateAvatar, removeAvatar, fetchMyPosts } from '../utils/axios';
import CreatePost from '../components/CreatePost';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationTray from '../components/NotificationTray';
import Avatar from '../components/Avatar';

const Dashboard = () => {
    const { user, socket, logout, login } = useAuth();
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Feed');
    const [settingsForm, setSettingsForm] = useState({ name: user?.name || '', tagline: user?.tagline || '', password: '' });
    const [updating, setUpdating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [cursorHistory, setCursorHistory] = useState([null]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        const loadPosts = async () => {
            setLoading(true);
            try {
                let response;
                const currentCursor = cursorHistory[currentIndex];
                if (activeTab === 'Feed') {
                    response = await fetchMyPosts(currentCursor);
                } else if (activeTab === 'Explore') {
                    response = await fetchPosts(currentCursor);
                } else {
                    setLoading(false);
                    return;
                }
                setPosts(response.data.data.posts);
                setNextCursor(response.data.data.nextCursor);
            } catch (err) {
                toast.error("Failed to load pulses");
            } finally {
                setLoading(false);
            }
        };
        loadPosts();
    }, [activeTab, currentIndex]);

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

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data } = await updateAccount(settingsForm);
            login(data.data, localStorage.getItem("token"));
            toast.success("Profile updated! ✨");
            setSettingsForm(prev => ({ ...prev, password: '' }));
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setUpdating(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("avatar", file);

        const toastId = toast.loading("Updating avatar...");
        try {
            const { data } = await updateAvatar(formData);
            login(data.data, localStorage.getItem("token"));
            toast.success("Avatar updated! ✨", { id: toastId });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update avatar", { id: toastId });
        }
    };

    const handleRemoveAvatar = async () => {
        if (!window.confirm("Remove your avatar?")) return;
        const toastId = toast.loading("Removing avatar...");
        try {
            const { data } = await removeAvatar();
            login(data.data, localStorage.getItem("token"));
            toast.success("Avatar removed! ✨", { id: toastId });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove avatar", { id: toastId });
        }
    };

    useEffect(() => {
        if (!socket) return;
        
        socket.on("new-post", (data) => {
            if (activeTab === 'Explore' && data.post.author._id !== user?._id) {
                setPosts(prev => [data.post, ...prev].slice(0, 8)); // keep max 8 on screen
            } else if (activeTab === 'Feed' && data.post.author._id === user?._id) {
                setPosts(prev => [data.post, ...prev]);
            }
            if (data.post.author._id !== user?._id) {
                toast(data.message, { icon: '✨', id: `new-${data.post._id}` });
            }
        });

        socket.on("post-deleted", (id) => {
            setPosts(prev => prev.filter(p => p._id !== id));
        });

        socket.on("update-likes", (data) => {
            setPosts(prev => prev.map(p =>
                p._id === data.postId ? { ...p, likes: data.likes } : p
            ));
        });

        socket.on("new-comment", (data) => {
            setPosts(prev => prev.map(p =>
                p._id === data.postId ? { ...p, comments: data.comments } : p
            ));
        });

        return () => {
            socket.off("new-post");
            socket.off("post-deleted");
            socket.off("update-likes");
            socket.off("new-comment");
        };
    }, [socket, user, activeTab]);

    return (
        <div className="min-h-screen bg-[#F8F7F4] flex font-['Instrument_Sans']">

            {/* CREATE POST MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold tracking-tighter">Broadcast a New Pulse</h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-[#F8F7F4] rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <CreatePost onSuccess={() => setShowCreateModal(false)} />
                        </div>
                    </div>
                </div>
            )}

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
                    <button
                        onClick={() => {
                            setActiveTab('Feed');
                            setCursorHistory([null]);
                            setCurrentIndex(0);
                            if(window.location.pathname !== '/dashboard') navigate('/dashboard');
                        }}
                        className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${activeTab === 'Feed' && window.location.pathname === '/dashboard' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
                    >
                        <span className="text-sm font-bold">Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/my-pulses')}
                        className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${window.location.pathname === '/my-pulses' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
                    >
                        <span className="text-sm font-bold">Your Pulses</span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('Explore');
                            setCursorHistory([null]);
                            setCurrentIndex(0);
                            if(window.location.pathname !== '/dashboard') navigate('/dashboard', { state: { activeTab: 'Explore' } });
                        }}
                        className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${activeTab === 'Explore' && window.location.pathname === '/dashboard' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
                    >
                        <span className="text-sm font-bold">Explore</span>
                    </button>
                    <button
                        onClick={() => navigate('/library')}
                        className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${window.location.pathname === '/library' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
                    >
                        <span className="text-sm font-bold">Saved Posts</span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('Settings');
                            setCursorHistory([null]);
                            setCurrentIndex(0);
                            if(window.location.pathname !== '/dashboard') navigate('/dashboard', { state: { activeTab: 'Settings' } });
                        }}
                        className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${activeTab === 'Settings' && window.location.pathname === '/dashboard' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
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
                            <h2 className="text-4xl font-bold text-[#2C3330] tracking-tight">
                                {activeTab === 'Explore' ? 'Explore Pulses' : activeTab === 'Settings' ? 'Account' : `Welcome back, `}
                                {activeTab === 'Feed' && <span className="text-[#526D62] italic font-serif ">{user?.name.charAt(0).toUpperCase() + user?.name.slice(1)}</span>}
                            </h2>
                            <p className="text-[#707774] mt-1 text-lg">
                                {activeTab === 'Explore' ? 'Discover what the community is sharing.' : activeTab === 'Settings' ? 'Manage your creator identity.' : 'Your creator workspace is ready.'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="bg-[#526D62] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#43594f] transition-all shadow-lg flex items-center space-x-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span>Create Pulse</span>
                            </button>
                            <NotificationTray />
                            <Avatar src={user?.avatar} name={user?.name} className="w-10 h-10 rounded-full object-cover" />
                        </div>
                    </div>
                </div>

                <div className="px-12 pb-20 mt-10">

                    {(activeTab === 'Feed' || activeTab === 'Explore') ? (
                        <div className="space-y-12">
                            <div className="space-y-8">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="text-2xl font-bold text-[#2C3330] tracking-tighter">
                                        {activeTab === 'Feed' ? 'Recent Activity' : 'Global Network'}
                                    </h3>
                                    {activeTab === 'Feed' && posts.length > 0 && (
                                        <button 
                                            onClick={() => navigate('/my-pulses')}
                                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526D62] hover:underline transition-all"
                                        >
                                            View All Stories →
                                        </button>
                                    )}
                                </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                        {loading ? (
                                            <div className="col-span-full flex justify-center py-20">
                                                <div className="w-10 h-10 border-4 border-[#526D62]/20 border-t-[#526D62] rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            <>
                                                {(activeTab === 'Feed' 
                                                    ? posts.slice(0, 4) 
                                                    : posts
                                                ).map(post => (
                                                    <div 
                                                        key={post._id} 
                                                        onClick={() => navigate(`/post/${post._id}`)}
                                                        className="group aspect-square relative rounded-[2.5rem] overflow-hidden border border-[#E8E4DF] shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer"
                                                    >
                                                    <img 
                                                        src={post.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000'} 
                                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                        alt={post.title} 
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                                        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                            <div className="flex items-center space-x-2 mb-3">
                                                                <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                                                    {post.category}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-white text-lg font-bold leading-tight line-clamp-2">
                                                                {post.title}
                                                            </h4>
                                                            {activeTab === 'Explore' && (
                                                                <div className="flex items-center space-x-2 mt-4">
                                                                    <Avatar src={post.author?.avatar} name={post.author?.name} className="w-5 h-5 rounded-full object-cover" />
                                                                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{post.author?.name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                ))}
                                                {posts.length === 0 && (
                                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-[#E8E4DF] rounded-[3rem] bg-white/50">
                                                        <p className="text-[#707774] italic">
                                                            {activeTab === 'Feed' 
                                                                ? "Your gallery is empty. Start by broadcasting a pulse!" 
                                                                : (currentIndex > 0 ? "No more pulses to display here." : "No pulses found in the network yet.")}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        </div>

                                {activeTab === 'Explore' && (currentIndex > 0 || nextCursor) && (
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
                        </div>
                    ) : (
                        /* SETTINGS VIEW */
                        <div className="max-w-4xl bg-white rounded-[3rem] p-12 border border-[#E8E4DF] shadow-sm">
                            <h3 className="text-3xl font-bold text-[#2C3330] mb-8 tracking-tighter">Account Settings</h3>
                            
                            <div className="flex items-center space-x-6 mb-10">
                                <div className="relative group">
                                    <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[#4285F4] via-[#EA4335] to-[#FBBC05] shadow-sm">
                                        <div className="p-[2px] bg-white rounded-full">
                                            <Avatar 
                                                src={user?.avatar} 
                                                name={user?.name}
                                                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" 
                                            />
                                        </div>
                                    </div>
                                    <label 
                                        htmlFor="avatar-upload" 
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        Change
                                    </label>
                                    <input 
                                        type="file" 
                                        id="avatar-upload" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleAvatarChange} 
                                    />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[#2C3330]">{user?.name}</h4>
                                    <p className="text-[#707774] text-sm mb-3">{user?.email}</p>
                                    {user?.avatar && (
                                        <button 
                                            onClick={handleRemoveAvatar}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-[0.1em] transition-colors"
                                        >
                                            Remove Photo
                                        </button>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleUpdateSettings} className="max-w-md space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] ml-1">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#F8F7F4] border border-[#E8E4DF] rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all"
                                        value={settingsForm.name}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] ml-1">Creator Tagline</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Minimalist Creator, Tech Enthusiast"
                                        className="w-full bg-[#F8F7F4] border border-[#E8E4DF] rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all"
                                        value={settingsForm.tagline}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] ml-1">Change Password</label>
                                    <input
                                        type="password"
                                        placeholder="New password (leave blank to keep current)"
                                        className="w-full bg-[#F8F7F4] border border-[#E8E4DF] rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all"
                                        value={settingsForm.password}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-[#526D62] text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#43594f] transition-all shadow-lg"
                                >
                                    {updating ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;