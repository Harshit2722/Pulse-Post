import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPostById, toggleLike, addComment, deleteComment, editPost, savePulse } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import NotificationTray from '../components/NotificationTray';
import Avatar from '../components/Avatar';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, setUser, socket } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [showAllComments, setShowAllComments] = useState(false);
    const [commentPage, setCommentPage] = useState(1);
    const commentsPerPage = 5;
    
    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", content: "" });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const loadPost = async () => {
            try {
                const { data } = await fetchPostById(id);
                setPost(data.data);
                setEditForm({ title: data.data.title, content: data.data.content });
            } catch (err) {
                toast.error(err.response?.data?.message || "Pulse could not be found");
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        loadPost();
    }, [id, navigate]);

    useEffect(() => {
        if (!socket || !post) return;

        socket.on("post-deleted", (deletedId) => {
            if (deletedId === id) {
                toast.error("This pulse has been removed by the creator");
                navigate('/dashboard');
            }
        });

        socket.on("update-likes", (data) => {
            if (data.postId === id) {
                setPost(prev => ({ ...prev, likes: data.likes }));
            }
        });

        socket.on("new-comment", (data) => {
            if (data.postId === id) {
                setPost(prev => ({ ...prev, comments: data.comments }));
            }
        });

        socket.on("comment-deleted", (data) => {
            if (data.postId === id) {
                setPost(prev => ({ ...prev, comments: data.comments }));
            }
        });

        socket.on("post-updated", (updatedPost) => {
            if (updatedPost._id === id) {
                setPost(updatedPost);
                setEditForm({ title: updatedPost.title, content: updatedPost.content });
                
                if (updatedPost.author?._id !== user?._id && updatedPost.author !== user?._id) {
                    toast.success("Pulse updated in real-time! ✨", { id: 'update-notif' });
                }
            }
        });

        return () => {
            socket.off("post-deleted");
            socket.off("update-likes");
            socket.off("new-comment");
            socket.off("comment-deleted");
            socket.off("post-updated");
        };
    }, [socket, post, id, user, navigate]);

    const handleLike = async () => {
        try {
            const { data } = await toggleLike(id);
            setPost(prev => ({ ...prev, likes: data.data.likes }));
        } catch (err) {
            toast.error("Failed to heart pulse");
        }
    };

    const handleSave = async () => {
        try {
            const { data } = await savePulse(id);
            setUser(prev => ({ ...prev, savedPosts: data.data }));
            toast.success(data.message);
        } catch (err) {
            toast.error("Failed to save pulse");
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const { data } = await addComment(id, commentText);
            setPost(prev => ({ ...prev, comments: data.data }));
            setCommentText("");
            toast.success("Reflection shared");
        } catch (err) {
            toast.error("Failed to share reflection");
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const { data } = await deleteComment(id, commentId);
            setPost(prev => ({ ...prev, comments: data.data }));
        } catch (err) {
            toast.error("Failed to remove reflection");
        }
    };

    const handleUpdatePost = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data } = await editPost(id, editForm);
            setPost(data.data);
            setIsEditing(false);
            toast.success("Pulse refined! ✨");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update pulse");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#526D62]/20 border-t-[#526D62] rounded-full animate-spin"></div>
                <p className="font-bold text-[#526D62] animate-pulse">Gathering Pulse...</p>
            </div>
        </div>
    );

    const displayedComments = post.comments?.slice(0, 2);
    const isSaved = user?.savedPosts?.includes(id);

    // Pagination Logic for Modal
    const totalPages = Math.ceil((post.comments?.length || 0) / commentsPerPage);
    const paginatedComments = post.comments?.slice(
        (commentPage - 1) * commentsPerPage, 
        commentPage * commentsPerPage
    );

    return (
        <div className="min-h-screen bg-[#F8F7F4] font-['Instrument_Sans'] text-[#2C3330] selection:bg-[#526D62] selection:text-white">
            
            {/* Header Navigation */}
            <nav className="h-20 px-10 flex items-center justify-between sticky top-0 bg-[#F8F7F4]/90 backdrop-blur-xl z-50 border-b border-[#E8E4DF]/50">
                <div 
                    onClick={() => navigate('/dashboard')} 
                    className="flex items-center space-x-3 cursor-pointer group"
                >
                    <div className="flex items-center">
                        <div className="w-2.5 h-2.5 bg-[#2C3330] rounded-full group-hover:bg-[#526D62] transition-colors"></div>
                        <div className="w-2.5 h-2.5 bg-[#2C3330] rounded-full -ml-1.5 mt-2 group-hover:bg-[#526D62] transition-colors delay-75"></div>
                        <div className="w-2.5 h-2.5 bg-[#2C3330] rounded-full -ml-1.5 group-hover:bg-[#526D62] transition-colors delay-150"></div>
                    </div>
                    <h1 className="text-xl font-black tracking-tighter uppercase">PULSE-POST</h1>
                </div>

                <div className="flex items-center space-x-8">
                    {post.author?._id === user?._id && (
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className={`p-2 transition-colors relative group ${isEditing ? 'text-[#526D62]' : 'text-[#707774] hover:text-[#2C3330]'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#2C3330] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {isEditing ? 'Cancel Edit' : 'Edit Pulse'}
                            </span>
                        </button>
                    )}
                    <NotificationTray />
                    <Avatar src={user?.avatar} name={user?.name} className="w-10 h-10 rounded-full border-2 border-[#E8E4DF] object-cover cursor-pointer hover:border-[#526D62] transition-all" />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-12 gap-16">
                
                {/* Left Column: Post Content */}
                <div className="col-span-8 space-y-12">
                    <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl border border-[#E8E4DF] bg-black/5">
                        <img 
                            src={post.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=2000'} 
                            className="w-full h-auto max-h-[80vh] object-contain transition-transform duration-1000 group-hover:scale-[1.02]" 
                            alt={post.title} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    <article className="max-w-3xl">
                        {!isEditing ? (
                            <>
                                <h2 className="text-5xl font-bold tracking-tighter leading-[1.1] text-[#2C3330] mb-12">
                                    {post.title}
                                </h2>
                                
                                <div className="prose prose-lg text-[#2C3330]/80 leading-[1.8] space-y-8 font-medium">
                                    <div className="bg-[#DAE2DF]/30 border-l-4 border-[#526D62] p-8 rounded-r-3xl my-10 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-xl italic font-serif text-[#2C3330] leading-relaxed whitespace-pre-wrap">
                                                {post.content}
                                            </p>
                                        </div>
                                        <div className="absolute -right-8 -bottom-8 text-9xl text-[#526D62]/5 font-serif select-none italic">"</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleUpdatePost} className="bg-white p-10 rounded-[2.5rem] border border-[#526D62]/20 shadow-xl space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold tracking-tighter">Refining your Pulse</h3>
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="text-[10px] font-bold uppercase tracking-widest text-[#707774] hover:text-red-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#707774] uppercase tracking-widest">Pulse Title</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-[#F8F7F4] border border-[#E8E4DF] rounded-2xl px-6 py-4 outline-none focus:border-[#526D62] transition-all font-bold text-lg"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#707774] uppercase tracking-widest">Content</label>
                                    <textarea 
                                        className="w-full bg-[#F8F7F4] border border-[#E8E4DF] rounded-2xl px-6 py-4 outline-none focus:border-[#526D62] transition-all min-h-[300px] leading-relaxed"
                                        value={editForm.content}
                                        onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-[#526D62] text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#43594f] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {updating ? "Syncing Pulse..." : "Save Refinements"}
                                </button>
                            </form>
                        )}
                    </article>

                    {/* Reflections Section */}
                    <section className="pt-16 border-t border-[#E8E4DF] max-w-3xl">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-bold tracking-tighter">
                                Reflections <span className="text-[#707774] font-normal ml-2">({post.comments?.length})</span>
                            </h3>
                            {post.comments?.length > 2 && (
                                <button 
                                    onClick={() => {
                                        setShowAllComments(true);
                                        setCommentPage(1);
                                    }}
                                    className="text-xs font-bold uppercase tracking-widest text-[#526D62] hover:underline transition-all"
                                >
                                    View All
                                </button>
                            )}
                        </div>

                        <div className="space-y-6 mb-12">
                            {displayedComments?.map((comment, idx) => (
                                <div key={idx} className="p-8 rounded-3xl bg-white border border-[#E8E4DF] shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-4">
                                            <Avatar src={comment.author?.avatar} name={comment.author?.name} className="w-10 h-10 rounded-full object-cover border border-[#E8E4DF]" />
                                            <div>
                                                <h4 className="text-sm font-bold">{comment.author?.name}</h4>
                                                <p className="text-[10px] text-[#707774] uppercase tracking-widest font-bold">Just now</p>
                                            </div>
                                        </div>
                                        {comment.author?._id === user?._id && (
                                            <button 
                                                onClick={() => handleDeleteComment(comment._id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[#2C3330]/90 leading-relaxed italic text-base">"{comment.content}"</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-[#E8E4DF]">
                            <form onSubmit={handleComment} className="flex items-center space-x-4">
                                <Avatar src={user?.avatar} name={user?.name} className="w-10 h-10 rounded-full object-cover border border-[#E8E4DF]" />
                                <input 
                                    placeholder="Share your reflection..." 
                                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder-[#707774]/50"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <button className="bg-[#526D62] text-white px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#43594f] transition-all shadow-md active:scale-95">
                                    Post Reflection
                                </button>
                            </form>
                        </div>
                    </section>
                </div>

                {/* Right Column: Sidebar */}
                <aside className="col-span-4 space-y-10 sticky top-32 h-fit">
                    
                    {/* Author Card */}
                    <div className="bg-[#F1EFEA]/50 rounded-[3rem] p-10 border border-[#E8E4DF] flex flex-col items-center text-center group transition-all hover:bg-white hover:shadow-xl">
                        <div className="relative mb-6">
                            <Avatar src={post.author?.avatar} name={post.author?.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#526D62] rounded-full border-2 border-white flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                        </div>
                        <h4 className="text-xl font-bold tracking-tight">{post.author?.name}</h4>
                        <p className="text-xs text-[#707774] font-medium mt-1 mb-6 uppercase tracking-widest">{post.author?.tagline || 'Creator'}</p>
                        
                        {post.author?._id !== user?._id && (
                            <button className="w-full bg-[#526D62] text-white py-4 rounded-3xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#43594f] transition-all shadow-lg active:scale-95 mb-10">
                                Follow
                            </button>
                        )}

                        <div className="w-full border-t border-[#E8E4DF] pt-8 flex justify-center">
                            <div className="text-center">
                                <p className="text-2xl font-black tracking-tighter">{post.likes.length}</p>
                                <p className="text-[10px] text-[#707774] uppercase tracking-widest font-bold">Total Likes</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions List */}
                    <div className="px-6 space-y-6">
                        <button 
                            onClick={handleLike}
                            className="flex items-center space-x-4 w-full text-[#707774] hover:text-[#526D62] transition-colors group"
                        >
                            <div className={`p-2 rounded-xl transition-all ${post.likes.includes(user?._id) ? 'bg-[#526D62] text-white' : 'bg-white group-hover:bg-[#526D62]/10'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill={post.likes.includes(user?._id) ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">Appreciate Post</span>
                        </button>                        <button 
                            onClick={handleSave}
                            className="flex items-center space-x-4 w-full text-[#707774] hover:text-[#2C3330] transition-colors group"
                        >
                            <div className={`p-2 rounded-xl transition-all ${isSaved ? 'bg-[#526D62] text-white' : 'bg-white group-hover:bg-[#E8E4DF]'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">{isSaved ? 'Pulse in Library' : 'Save for Later'}</span>
                        </button>
                    </div>
                </aside>
            </main>

            {/* Comments Modal with Pagination */}
            {showAllComments && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2C3330]/40 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
                    <div className="bg-[#F8F7F4] w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-[#E8E4DF] animate-[modalPop_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="p-8 border-b border-[#E8E4DF] flex items-center justify-between bg-white shrink-0">
                            <h3 className="text-2xl font-bold tracking-tighter">
                                All Reflections <span className="text-[#707774] font-normal ml-2">({post.comments?.length})</span>
                            </h3>
                            <button 
                                onClick={() => setShowAllComments(false)}
                                className="w-10 h-10 bg-[#F1EFEA] hover:bg-[#E8E4DF] rounded-full flex items-center justify-center transition-colors text-[#2C3330]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {paginatedComments?.map((comment, idx) => (
                                <div key={idx} className="p-6 rounded-3xl bg-white border border-[#E8E4DF] shadow-sm group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-4">
                                            <Avatar src={comment.author?.avatar} name={comment.author?.name} className="w-10 h-10 rounded-full object-cover border border-[#E8E4DF]" />
                                            <div>
                                                <h4 className="text-sm font-bold">{comment.author?.name}</h4>
                                                <p className="text-[10px] text-[#707774] uppercase tracking-widest font-bold">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {comment.author?._id === user?._id && (
                                            <button 
                                                onClick={() => handleDeleteComment(comment._id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[#2C3330]/90 leading-relaxed italic text-sm">"{comment.content}"</p>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="p-6 border-t border-[#E8E4DF] bg-white shrink-0 flex items-center justify-between">
                                <button 
                                    onClick={() => setCommentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={commentPage === 1}
                                    className="px-6 py-2.5 rounded-xl border border-[#E8E4DF] text-xs font-bold uppercase tracking-widest text-[#2C3330] hover:bg-[#F8F7F4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-xs font-bold text-[#707774] uppercase tracking-widest">
                                    Page {commentPage} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCommentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={commentPage === totalPages}
                                    className="px-6 py-2.5 rounded-xl border border-[#E8E4DF] text-xs font-bold uppercase tracking-widest text-[#2C3330] hover:bg-[#F8F7F4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostDetail;
