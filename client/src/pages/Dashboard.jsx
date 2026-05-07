import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPosts, deletePost, toggleLike } from '../utils/axios';
import CreatePost from '../components/CreatePost';
import { toast } from 'react-hot-toast';
const Dashboard = () => {
    const { user, socket, logout } = useAuth();
    const [posts, setPosts] = useState([]);
    // --- YOUR EXACT LOGIC (UNTOUCHED) ---
    useEffect(() => {
        const loadPosts = async () => {
            try {
                const { data } = await fetchPosts();
                setPosts(data.data);
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to load feed");
            }
        };
        loadPosts();
    }, []);
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
                        toast(`${postToDelete.author.username} deleted a pulse`, { icon: '🗑️', id: `del-${id}` });
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
        return () => {
            socket.off("new-post");
            socket.off("post-deleted");
            socket.off("update-likes");
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
            toast.error(err.response?.data?.message || "Failed to update like");
        }
    };
    // --- NEW ZEN RETURN (CSS ONLY CHANGES) ---
    return (
        <div className="min-h-screen bg-[#F8F7F4] flex font-['Instrument_Sans']">
            
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-[#F1EFEA] border-r border-[#E8E4DF] flex flex-col p-8 fixed h-full z-10">
                <div className="mb-12">
                    <h1 className="text-xl font-bold tracking-tighter text-[#2C3330]">PULSE-POST</h1>
                    <p className="text-[10px] text-[#707774] uppercase tracking-widest font-bold mt-1">Creator Network</p>
                </div>
                
                <nav className="space-y-3 flex-1">
                    {['Feed', 'Discover', 'Pulse', 'Community', 'Settings'].map((item) => (
                        <button key={item} className={`flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${item === 'Pulse' ? 'bg-[#526D62] text-white shadow-lg' : 'text-[#707774] hover:bg-white/50'}`}>
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
                
                {/* Catchy Header (Icon removed) */}
                <div className="px-12 py-12">
                    <h2 className="text-4xl font-bold text-[#2C3330] tracking-tight">
                        Welcome back, <span className="text-[#526D62] text-3xl font-medium lowercase italic">@{user?.username}</span>
                    </h2>
                    <p className="text-[#707774] mt-1 text-lg">Your creator workspace is ready.</p>
                </div>
                <div className="px-12 grid grid-cols-12 gap-8 pb-20">
                    
                    {/* CENTER FEED */}
                    <div className="col-span-8 space-y-10">
                        
                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { label: 'Total Reach', value: '12.4k', note: 'Views this week' },
                                { label: 'Engagement', value: '892', note: 'Interactions' },
                                { label: 'Network Size', value: '2.1k', note: 'Active connections' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-7 rounded-[2rem] border border-[#E8E4DF] shadow-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-[#707774] font-bold mb-3">{stat.label}</p>
                                    <h4 className="text-3xl font-bold text-[#2C3330]">{stat.value}</h4>
                                    <p className="text-[10px] text-green-600 font-bold mt-2">{stat.note}</p>
                                </div>
                            ))}
                        </div>
                        {/* Pulse Composer */}
                        <div className="bg-white rounded-[2.5rem] p-2 shadow-sm border border-[#E8E4DF]">
                             <CreatePost />
                        </div>
                        {/* Recent Pulses */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-[#2C3330] px-2 mb-4">Your Recent Pulses</h3>
                            {posts.length === 0 ? (
                                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-[#E8E4DF]">
                                    <p className="text-[#707774] font-medium italic">Your digital garden is waiting for its first pulse.</p>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <div key={post._id} className="bg-white rounded-[2.5rem] p-10 border border-[#E8E4DF] shadow-sm group hover:border-[#526D62]/30 transition-all relative">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <span className="bg-[#DAE2DF] text-[#526D62] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tight">
                                                {post.category || 'General'}
                                            </span>
                                            <span className="text-[10px] text-[#707774] font-bold uppercase">
                                                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-bold text-[#2C3330] mb-3 leading-tight">{post.title || "Untitled Pulse"}</h4>
                                        <p className="text-[#707774] leading-relaxed text-lg line-clamp-3 whitespace-pre-wrap">{post.content}</p>
                                        
                                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-[#F1EFEA]">
                                            <div className="flex items-center space-x-6">
                                                <button onClick={() => handleLike(post._id)} className="flex items-center space-x-2 text-sm font-bold text-[#707774] hover:text-[#526D62] transition-colors">
                                                    <span className="text-base">{post.likes.includes(user?._id) ? '❤️' : '🤍'}</span>
                                                    <span>{post.likes.length}</span>
                                                </button>
                                            </div>
                                            
                                            {post.author._id === user?._id && (
                                                <button 
                                                    onClick={() => handleDelete(post._id)} 
                                                    className="text-[10px] font-black text-[#707774] hover:text-red-500 tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    REMOVE PULSE
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {/* RIGHT COLUMN */}
                    <div className="col-span-4 space-y-8">
                        <div className="bg-[#F1EFEA] rounded-[2rem] p-8 border border-[#E8E4DF]">
                            <h5 className="text-xs font-bold text-[#2C3330] uppercase tracking-widest mb-6">Trending Tags</h5>
                            <div className="space-y-4">
                                {['#Mindfulness', '#SlowLiving', '#Minimalism'].map(tag => (
                                    <div key={tag} className="flex justify-between items-center text-sm font-bold text-[#707774]">
                                        <span>{tag}</span>
                                        <span className="text-[10px] text-[#94a3b8]">1.2k</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-[#526D62] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                             <div className="relative z-10">
                                <h5 className="text-xl font-bold mb-3">Audience Impact</h5>
                                <p className="text-white/70 text-sm mb-6 leading-relaxed">You've reached 12 new creators this week. Your network is expanding.</p>
                                <button className="bg-white text-[#526D62] w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#F8F7F4] transition-colors">
                                    Analytics
                                </button>
                             </div>
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default Dashboard;