import { useState } from 'react';
import { createPost } from '../utils/axios';
import { toast } from 'react-hot-toast';

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            await createPost({ content });
            setContent('');
            toast.success("Pulse sent! 🚀");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to post pulse");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8">
            <form onSubmit={handleSubmit}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's your Pulse today?"
                    className="w-full bg-transparent text-white placeholder-gray-500 border-none focus:ring-0 text-lg resize-none"
                    rows="3"
                />
                <div className="flex justify-end mt-4 pt-4 border-t border-white/10">
                    <button
                        type="submit"
                        disabled={loading || !content.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-6 py-2 rounded-lg transition-all disabled:opacity-50"
                    >
                        {loading ? "Posting..." : "Post Pulse"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
