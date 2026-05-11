import React, { useState } from 'react';
import { createPost } from '../utils/axios';
import { toast } from 'react-hot-toast';

const CreatePost = () => {
    const [form, setForm] = useState({ content: '', title: '', category: 'General', image: '' });
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.error("Please add a title");
        if (!form.content.trim()) return toast.error("Pulse cannot be empty");

        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("content", form.content);
        formData.append("category", form.category);
        if (image) formData.append("image", image);
        
        setLoading(true);
        try {
            await createPost(formData);
            setForm({ content: '', title: '', category: 'General', image: '' });
            setImage(null);
            setPreview(null);
            toast.success("Pulse broadcasted! ✨");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to pulse");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        try {
            if (file) {
                setImage(file);
                setPreview(URL.createObjectURL(file));
            }
        }
        catch(error){
            toast.error(error.response?.data?.message || "Error previewing image");
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
                            <option value="Lifestyle">Lifestyle</option>
                            <option value="Photography">Photography</option>
                            <option value="Technology">Technology</option>
                            <option value="Travel">Travel</option>
                            <option value="Art">Art</option>
                            <option value="Wellness">Wellness</option>
                        </select>
                    </div>

                    {/* CONTENT AREA */}
                    <textarea
                        className="w-full h-24 bg-transparent text-[#2C3330] text-lg leading-relaxed placeholder-[#707774]/40 outline-none resize-none"
                        placeholder="What's on your mind?"
                        value={form.content}
                        onChange={(e) => setForm({...form, content: e.target.value})}
                    />

                    {/* IMAGE PREVIEW */}
                    {preview && (
                        <div className="relative animate-in fade-in zoom-in-95 duration-300">
                            <div className="relative rounded-2xl overflow-hidden border border-[#E8E4DF] group/preview">
                                <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => { setImage(null); setPreview(null); }}
                                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ACTIONS & BUTTONS */}
                    <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center space-x-2">
                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                id="post-image" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                            />
                            
                            {/* Trigger Label */}
                            <label 
                                htmlFor="post-image" 
                                className="cursor-pointer flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#F8F7F4] hover:bg-[#E6D5C3] text-[#707774] transition-all group/icon"
                            >
                                <span className="text-lg group-hover/icon:scale-110 transition-transform">🖼️</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Add Media</span>
                            </label>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#526D62] text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-sage-900/10 hover:bg-[#43594f] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? "Broadcasting..." : "Broadcast"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
