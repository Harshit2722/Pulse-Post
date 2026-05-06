import { useState, useEffect,useRef} from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPosts,deletePost,toggleLike } from '../utils/axios';
import CreatePost from '../components/CreatePost';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const { user, socket, logout } = useAuth();
    const [posts, setPosts] = useState([]);
    const notifiedRef = useRef(new Set());

    // 1. Initial Fetch
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

    // 2. Real-time Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on("new-post", (data) => {
            // Add the new post to the top of the feed instantly
            setPosts(prev => [data.post, ...prev]);
            
            //show a small toast notification
            if (data.post.author._id !== user?._id) {
                toast(`${data.post.author.username} just pulsed!`, { icon: '🔔' });
            }
        })
        
        socket.on("post-deleted", (id) => {
            // 1. Check if we already notified for this ID
            if (notifiedRef.current.has(id)) return;
            notifiedRef.current.add(id);

            setPosts((prevPosts) => {
                const postToDelete = prevPosts.find(p => p._id === id);
        
        if (postToDelete) {
            // Add an 'id' to the toast options
            if (postToDelete.author._id === user?._id) {
                toast.success("Your pulse has been deleted 🗑️", { id: `delete-${id}` });
            } else {
                toast(`${postToDelete.author.username} just deleted a pulse!`, { icon: "🔔", id: `delete-${id}` });
            }
        }
        return prevPosts.filter(p => p._id !== id);
    });
    });

    socket.on("update-likes", (data) => {
    setPosts(prev => prev.map(p => 
        p._id === data.postId ? { ...p, likes: data.likes } : p
    ));

    // Optional: Show notification if someone likes YOUR post
    if (data.isLikedNow && data.likerName !== user.username) {
        toast(`${data.likerName} loved your pulse!`, { icon: '❤️', id: `like-${data.postId}` });
    }
    }); 




        

        return () => {
            socket.off("new-post");
            socket.off("post-deleted");
            socket.off("update-likes");
        };
    }, [socket, user]);


     const handleDelete = async (postId) => {
        if (!window.confirm("Are you sure? This pulse will be lost in space! 🌌")) return;
        try {
            await deletePost(postId)
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete pulse");
        }
    };


    const handleLike = async (postId) => {
    try {
        await toggleLike(postId);
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to like post");
    }
};


    return (
    <div className="min-h-screen bg-[#080d1a] text-white flex flex-col">
        
        {/* --- 1. FULL WIDTH HEADER --- */}
        <header className="w-full bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
                    {user.username[0].toUpperCase()}
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white leading-none">{user.username}</h1>
                    <p className="text-gray-500 text-xs mt-1">Welcome back, creator</p>
                </div>
            </div>

            <div className="flex items-center space-x-6">
                <div className="h-8 w-[1px] bg-white/10"></div>
                <button 
                    onClick={logout} 
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold px-4 py-2 rounded-full border border-red-500/20 transition-all uppercase tracking-widest"
                >
                    Sign Out
                </button>
            </div>
        </header>

        {/* --- 2. TWO-COLUMN MAIN CONTENT --- */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-8">
            
            {/* LEFT SIDE: Creation Area (Sticky) */}
            <aside className="lg:col-span-4 xl:col-span-3">
                <div className="sticky top-28">
                    <div className="mb-6">
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            New Pulse
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Share your thoughts with the world</p>
                    </div>
                    <CreatePost />
                </div>
            </aside>

            {/* RIGHT SIDE: The Pulse Feed */}
            <section className="lg:col-span-8 xl:col-span-9">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-300 flex items-center space-x-2">
                        <span>Pulse Feed</span>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    </h3>
                    <p className="text-gray-500 text-sm font-mono uppercase tracking-tighter">Live Updates Enabled</p>
                </div>

                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                            <p className="text-gray-500 text-lg">The feed is silent... wake it up! ✨</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post._id} className="relative bg-[#0f172a]/50 border border-white/10 p-8 rounded-3xl group transition-all hover:border-blue-500/30 hover:bg-white/[0.03]">
                                 {/* --- TOP RIGHT ACTIONS (LIKE & DELETE) --- */}
                                    <div className="absolute top-6 right-6 flex items-center space-x-2">
    
                                    {/* LIKE BUTTON */}    
                                    <button 
                                        onClick={() => handleLike(post._id)}
                                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all border ${
                                            post.likes.includes(user?._id) 
                                            ? 'bg-pink-500/10 border-pink-500/20 text-pink-500' 
                                            : 'bg-white/5 border-white/5 text-gray-500 hover:text-pink-400 hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-sm">{post.likes.includes(user?._id) ? '❤️' : '🤍'}</span>
                                        <span className="text-xs font-bold font-mono">{post.likes.length}</span>
                                    </button>
                                    

                                    {/* DELETE BUTTON (Only for owner) */}
                                    {post.author._id === user?._id && (
                                        <button 
                                            onClick={() => handleDelete(post._id)}
                                            className="p-1.5 bg-white/5 rounded-full text-gray-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all border border-white/5"
                                            title="Delete Pulse"
                                        >
                                            <span className="text-sm">🗑️</span>
                                        </button>
                                    )}
                                </div>


                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-blue-400 border border-white/10 transform rotate-3 group-hover:rotate-0 transition-transform">
                                        {post.author.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg leading-tight">{post.author.username}</h4>
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            {new Date(post.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-300 leading-relaxed text-xl font-light whitespace-pre-wrap">{post.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
    </div>
);

};

export default Dashboard;
