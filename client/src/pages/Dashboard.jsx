import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPosts, deletePost, toggleLike, addComment, incrementView, updateAccount } from '../utils/axios';
import CreatePost from '../components/CreatePost';
import { toast } from 'react-hot-toast';
const Dashboard = () => {
    const { user, socket, logout } = useAuth();
    const [posts, setPosts] = useState([]);
    // --- YOUR EXACT LOGIC (UNTOUCHED) ---
    const [expandedComments, setExpandedComments] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [activeTab, setActiveTab] = useState('Feed');
    const [settingsForm, setSettingsForm] = useState({ name: user?.name || '', password: '' });
    const [updating, setUpdating] = useState(false);
    const { login } = useAuth();

    const hasFetched = useRef(false);

    useEffect(() => {
        const loadPosts = async () => {
            if (hasFetched.current) return;
            hasFetched.current = true;

            try {
                const { data } = await fetchPosts();
                setPosts(data.data);
                // Increment views for all loaded posts once
                data.data.forEach(p => incrementView(p._id).catch(() => { }));
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
            // Use login from context to refresh local user state
            login(data.data, localStorage.getItem("token"));
            toast.success("Profile updated! ✨");
            setSettingsForm(prev => ({ ...prev, password: '' }));
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setUpdating(false);
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
                const post = prev.find(p => p._id === data.postId);
                if (data.isLikedNow && post?.author?._id === user?._id && data.likerName !== user?.username) {
                    toast(`${data.likerName} loved your pulse!`, { icon: '❤️', id: `like-${data.postId}` });
                }
                return prev.map(p =>
                    p._id === data.postId ? { ...p, likes: data.likes } : p
                );
            });
        });

        socket.on("new-comment", (data) => {
            setPosts(prev => prev.map(p =>
                p._id === data.postId ? { ...p, comments: data.comments } : p
            ));

            if (data.postAuthorId === user?._id && data.commenterName !== user?.name) {
                toast(`${data.commenterName} shared a reflection on your pulse!`, { icon: '💬', id: `comm-${data.postId}-${Date.now()}` });
            }
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
                    {['Feed', 'Settings'].map((item) => (
                        <button
                            key={item}
                            onClick={() => setActiveTab(item)}
                            className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${activeTab === item ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}
                        >
                            <span className="text-sm font-bold">{item}</span>
                        </button>
                    ))}
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
                    <p className="text-[#707774] mt-1 text-lg">Your creator workspace is ready.</p>
                </div>

                <div className="px-12 grid grid-cols-12 gap-8 pb-20">

                    {activeTab === 'Feed' ? (
                        <>
                            {/* CENTER FEED */}
                            <div className="col-span-8 space-y-10">
                                <div className="bg-white rounded-[2.5rem] p-2 shadow-sm border border-[#E8E4DF]">
                                    <CreatePost />
                                </div>

                                <div className="space-y-6">
                                    {posts.map(post => (
                                        <div key={post._id} className="bg-white rounded-[2.5rem] p-10 border border-[#E8E4DF] shadow-sm group transition-all relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-3">
                                                    <span className="bg-[#DAE2DF] text-[#526D62] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tight">
                                                        {post.category}
                                                    </span>
                                                    <div className="flex items-center space-x-2">
                                                        {post.author?.avatar ? (
                                                            <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-[#E6D5C3] flex items-center justify-center text-[10px] font-bold text-[#2C3330]">
                                                                {post.author?.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-bold text-[#2C3330] italic font-serif lowercase">{post.author?.name}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-[#707774] font-bold uppercase">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h4 className="text-2xl font-bold text-[#2C3330] mb-3 leading-tight">{post.title}</h4>
                                            <p className="text-[#707774] leading-relaxed text-lg whitespace-pre-wrap">{post.content}</p>

                                            {post.image && (
                                                <img src={post.image} className="mt-6 rounded-2xl w-full h-64 object-cover border border-[#F1EFEA]" alt="Pulse" />
                                            )}

                                            <div className="mt-8 flex items-center justify-between pt-6 border-t border-[#F1EFEA]">
                                                <div className="flex items-center space-x-8">
                                                    <button onClick={() => handleLike(post._id)} className="flex items-center space-x-2 text-sm font-bold text-[#707774] hover:text-[#526D62] transition-colors">
                                                        <span className="text-base">{post.likes.includes(user?._id) ? '❤️' : '🤍'}</span>
                                                        <span>{post.likes.length}</span>
                                                    </button>
                                                    <div className="flex items-center space-x-2 text-sm font-bold text-[#707774]">
                                                        <span className="text-base">👁️</span>
                                                        <span>{post.views || 0}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setExpandedComments(expandedComments === post._id ? null : post._id)}
                                                        className="flex items-center space-x-2 text-sm font-bold text-[#707774] hover:text-[#526D62] transition-colors"
                                                    >
                                                        <span className="text-base">💬</span>
                                                        <span>{post.comments?.length || 0}</span>
                                                    </button>
                                                </div>

                                                {post.author?._id === user?._id && (
                                                    <button onClick={() => handleDelete(post._id)} className="text-[10px] font-black text-red-400 hover:text-red-600 tracking-widest opacity-0 group-hover:opacity-100 transition-all uppercase">
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>

                                            {/* EXPANDABLE COMMENT SECTION */}
                                            {expandedComments === post._id && (
                                                <div className="mt-8 pt-8 border-t border-[#F1EFEA] animate-in slide-in-from-top-4 duration-300">
                                                    <div className="space-y-6 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                        {post.comments?.map((comment, idx) => (
                                                            <div key={idx} className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-[#526D62] uppercase tracking-widest mb-1">
                                                                    {comment.author?.name}
                                                                </span>
                                                                <p className="text-sm text-[#707774] leading-relaxed">{comment.content}</p>
                                                            </div>
                                                        ))}
                                                        {post.comments?.length === 0 && (
                                                            <p className="text-sm italic text-[#707774]/50">No reflections yet.</p>
                                                        )}
                                                    </div>

                                                    <div className="flex space-x-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Add a reflection..."
                                                            className="flex-1 bg-[#F8F7F4] border border-[#E8E4DF] rounded-xl px-5 py-3 text-sm outline-none focus:border-[#526D62]"
                                                            value={commentText}
                                                            onChange={(e) => setCommentText(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && submitComment(post._id)}
                                                        />
                                                        <button
                                                            onClick={() => submitComment(post._id)}
                                                            className="bg-[#526D62] text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#43594f] transition-colors"
                                                        >
                                                            Post
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
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