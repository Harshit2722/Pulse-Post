import React, { useState } from 'react';
import { createPost } from '../utils/axios';
import { toast } from 'react-hot-toast';
const CreatePost = () => {
    const [form, setForm] = useState({ content: '', title: '', category: 'General', image: '' });
    const [loading, setLoading] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.error("Please add a title");
        if (!form.content.trim()) return toast.error("Pulse cannot be empty");
        
        setLoading(true);
        try {
            await createPost(form);
            setForm({ content: '', title: '', category: 'General', image: '' });
            setShowImageInput(false);
            toast.success("Pulse broadcasted! ✨");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to pulse");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group relative">
            {/* SOFT HOVER GLOW */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#526D62]/5 to-[#526D62]/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <form onSubmit={handleSubmit} className="relative bg-white rounded-[2.2rem] p-10 transition-all duration-300 border border-transparent focus-within:border-[#DAE2DF] shadow-sm hover:shadow-xl hover:shadow-sage-900/5">
                
                <div className="flex flex-col space-y-6">
                    {/* TITLE & CATEGORY */}
                    <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-4">
                        <input 
                            type="text"
                            placeholder="Title of your Pulse..."
                            className="flex-1 bg-transparent text-xl font-bold text-[#2C3330] placeholder-[#707774]/30 outline-none"
                            value={form.title}
                            onChange={(e) => setForm({...form, title: e.target.value})}
                        />
                        <select 
                            className="bg-[#F8F7F4] text-[10px] font-black uppercase tracking-widest text-[#526D62] px-4 py-2 rounded-full outline-none hover:bg-[#DAE2DF] transition-colors"
                            value={form.category}
                            onChange={(e) => setForm({...form, category: e.target.value})}
                        >
                            <option value="General">General</option>
                            <option value="Thought">Thought</option>
                            <option value="Update">Update</option>
                            <option value="Idea">Idea</option>
                            <option value="Photography">Photography</option>
                        </select>
                    </div>

                    {/* CONTENT AREA */}
                    <textarea
                        className="w-full h-24 bg-transparent text-[#2C3330] text-lg leading-relaxed placeholder-[#707774]/40 outline-none resize-none"
                        placeholder="What's on your mind?"
                        value={form.content}
                        onChange={(e) => setForm({...form, content: e.target.value})}
                    />

                    {/* IMAGE URL INPUT */}
                    {showImageInput && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                             <input 
                                type="text"
                                placeholder="Paste Image URL here (e.g. from Unsplash)..."
                                className="w-full bg-[#F8F7F4] border border-[#E8E4DF] rounded-xl px-5 py-3 text-sm text-[#707774] outline-none focus:border-[#526D62]"
                                value={form.image}
                                onChange={(e) => setForm({...form, image: e.target.value})}
                            />
                        </div>
                    )}

                    {/* BUTTONS */}
                    <div className="flex justify-between items-center pt-2">
                        <div className="flex space-x-5">
                            <button 
                                type="button" 
                                onClick={() => setShowImageInput(!showImageInput)}
                                className={`text-xl transition-all ${showImageInput ? 'scale-110' : 'grayscale opacity-40 hover:opacity-100'}`}
                            >
                                🖼️
                            </button>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#526D62] text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-sage-900/10 hover:bg-[#43594f] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? "Pulsing..." : "Broadcast"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
export default CreatePost;