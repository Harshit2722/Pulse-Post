import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPosts, deletePost, toggleLike, addComment, updateAccount, updateAvatar } from '../utils/axios';
import CreatePost from '../components/CreatePost';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationTray from '../components/NotificationTray';

const Dashboard = () => {
    const { user, socket, logout, login } = useAuth();
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [expandedComments, setExpandedComments] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Feed');
    const [settingsForm, setSettingsForm] = useState({ name: user?.name || '', password: '' });
    const [updating, setUpdating] = useState(false);

    const navigate = useNavigate();

    const hasFetched = useRef(false);

    useEffect(() => {
        const loadPosts = async () => {
            if (hasFetched.current) return;
            hasFetched.current = true;

            try {
                const { data } = await fetchPosts();
                setPosts(data.data);
            } catch (err) {
                toast.error("Failed to load feed");
            }
        };
        loadPosts();
    }, []);

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

    const submitComment = async (postId) => {
        if (!commentText.trim()) return;
        try {
            const { data } = await addComment(postId, commentText);
            setPosts(prev => prev.map(p =>
                p._id === postId ? { ...p, comments: data.data } : p
            ));
            setCommentText("");
            toast.success("Reflection added");
        } catch (err) {
            toast.error("Failed to add comment");
        }
    };

    useEffect(() => {
        if (!socket) return;
        socket.on("new-post", (data) => {
            setPosts(prev => [data.post, ...prev]);
            if (data.post.author._id !== user?._id) {
                toast(data.message, { icon: '✨', id: `new-${data.post._id}` });
            }
        });

        socket.on("post-deleted", (id) => {
            setPosts((prevPosts) => {
                const postToDelete = prevPosts.find(p => p._id === id);
                if (postToDelete) {
                    if (postToDelete.author._id === user?._id) {
                        toast.success("Pulse removed", { id: `del-${id}` });
                    } else {
                        toast(`${postToDelete.author.name} deleted a pulse`, { icon: '🗑️', id: `del-${id}` });
                    }
                }
                return prevPosts.filter(p => p._id !== id);
            });
        });

        socket.on("update-likes", (data) => {
            setPosts(prev => {
                return prev.map(p =>
                    p._id === data.postId ? { ...p, likes: data.likes } : p
                );
            });
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
    }, [socket, user]);

    const handleDelete = async (postId) => {
        if (!window.confirm("Delete this pulse?")) return;
        try {
            await deletePost(postId);
        } catch (err) {
            toast.error("Failed to delete pulse");
        }
    };

    const handleLike = async (postId) => {
        try {
            await toggleLike(postId);
        } catch (err) {
            toast.error("Failed to update like");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F7F4] flex font-['Instrument_Sans']">

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-[#F1EFEA] border-r border-[#E8E4DF] flex flex-col p-8 fixed h-full z-10">
                <div className="mb-12">
                    <div className="flex items-center space-x-3 text-[#2C3330]">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-[#2C3330] rounded-full"></div>
                            <div className="w-2 h-2 bg-[#2C3330] rounded-full -ml-1 mt-1.5"></div>
                            <div className="w-2 h-2 bg-[#2C3330] rounded-full -ml-1"></div>
                        </div>
                        <h1 className="text-lg font-black tracking-tighter uppercase font-sans">PULSE-POST</h1>
                    </div>
                    <p className="text-[10px] text-[#707774] uppercase tracking-widest font-bold mt-1 ml-1">Creator Network</p>
                </div>

                <nav className="space-y-3 flex-1">
                    <button
                        onClick={() => setActiveTab('Feed')}
                        className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${activeTab === 'Feed' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
                    >
                        <span className="text-sm font-bold">Feed</span>
                    </button>
                    <button
                        onClick={() => navigate('/library')}
                        className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${window.location.pathname === '/library' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
                    >
                        <span className="text-sm font-bold">Library</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('Settings')}
                        className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${activeTab === 'Settings' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
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
                        <h2 className="text-4xl font-bold text-[#2C3330] tracking-tight">
                            Welcome back, <span className="text-[#526D62] italic font-serif ">{user?.name.charAt(0).toUpperCase() + user?.name.slice(1)}</span>
                        </h2>
                        <div className="flex items-center space-x-6">
                            <NotificationTray />
                            {user?.avatar && (
                                <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[#4285F4] via-[#EA4335] to-[#FBBC05] animate-gradient-x shadow-sm">
                                    <div className="p-[2px] bg-white rounded-full">
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-[#707774] mt-1 text-lg">Your creator workspace is ready.</p>
                </div>

                <div className="px-12 grid grid-cols-12 gap-8 pb-20 mt-10">

                    {activeTab === 'Feed' ? (
                        <>
                            {/* CENTER FEED */}
                            <div className="col-span-8 space-y-12">
                                <div className="bg-white rounded-[2.5rem] p-2 shadow-sm border border-[#E8E4DF]">
                                    <CreatePost />
                                </div>
                                {/* RECENT PULSES GALLERY */}
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between px-4">
                                        <h3 className="text-2xl font-bold text-[#2C3330] tracking-tighter">Recent Pulses</h3>
                                        <button 
                                            onClick={() => setActiveTab('Settings')} // Or create a new tab for 'Gallery'
                                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526D62] hover:underline transition-all"
                                        >
                                            View Full Gallery →
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        {posts.slice(0, 4).map(post => (
                                            <div 
                                                key={post._id} 
                                                onClick={() => navigate(`/post/${post._id}`)}
                                                className="group aspect-square relative rounded-[2.5rem] overflow-hidden border border-[#E8E4DF] shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer"
                                            >
                                                {/* Background Image */}
                                                <img 
                                                    src={post.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000'} 
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                    alt={post.title} 
                                                />
                                                
                                                {/* Immersive Hover Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                
                                                {/* Content */}
                                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                        <div className="flex items-center space-x-2 mb-3">
                                                            <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                                                {post.category}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-white text-xl font-bold leading-tight line-clamp-2">
                                                            {post.title}
                                                        </h4>
                                                        <p className="text-white/60 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 line-clamp-1">
                                                            {new Date(post.createdAt).toLocaleDateString()} • Click to expand
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {posts.length === 0 && (
                                            <div className="col-span-2 py-20 text-center border-2 border-dashed border-[#E8E4DF] rounded-[2.5rem]">
                                                <p className="text-[#707774] italic">Your gallery is empty. Start by broadcasting a pulse!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="col-span-4 space-y-8">
                                <div className="bg-[#526D62] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                                    <h5 className="text-xl font-bold mb-3 relative z-10">Creator Tip</h5>
                                    <p className="text-white/70 text-sm leading-relaxed relative z-10">Regular pulses with a consistent category help your audience resonate with your story.</p>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* SETTINGS VIEW */
                        <div className="col-span-8 bg-white rounded-[2.5rem] p-12 border border-[#E8E4DF] shadow-sm">
                            <h3 className="text-3xl font-bold text-[#2C3330] mb-8 tracking-tighter">Account Settings</h3>
                            
                            {/* 📸 AVATAR SECTION */}
                            <div className="flex items-center space-x-6 mb-10">
                                <div className="relative group">
                                    <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[#4285F4] via-[#EA4335] to-[#FBBC05] shadow-sm">
                                        <div className="p-[2px] bg-white rounded-full">
                                            <img 
                                                src={user?.avatar} 
                                                alt="Profile" 
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
                                    <p className="text-[#707774] text-sm">{user?.email}</p>
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