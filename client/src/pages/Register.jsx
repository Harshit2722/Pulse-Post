import { useState } from 'react';
import { registerUser } from '../utils/axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Full Name is required";
        if (!form.email.includes("@")) newErrors.email = "Please enter a valid email";
        if (form.password.length < 6) newErrors.password = "Password must be 6+ characters";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    };
    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await registerUser(form);
            toast.success("Welcome! 🚀");
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="h-screen w-screen flex bg-white font-['Instrument_Sans'] overflow-hidden">
            
            <div className="hidden lg:flex lg:w-1/2 bg-[#DAE2DF] p-16 flex-col justify-center relative overflow-hidden h-full">
                
                {/* FLOATING STARS */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <span className="zen-drifter" style={{ left: '10%', animationDuration: '15s' }}>✦</span>
                    <span className="zen-drifter" style={{ left: '30%', animationDuration: '22s', animationDelay: '2s' }}>✧</span>
                    <span className="zen-drifter" style={{ left: '50%', animationDuration: '18s', animationDelay: '5s' }}>✦</span>
                    <span className="zen-drifter" style={{ left: '70%', animationDuration: '25s', animationDelay: '1s' }}>✧</span>
                    <span className="zen-drifter" style={{ left: '90%', animationDuration: '20s', animationDelay: '7s' }}>✦</span>
                </div>
                <div className="absolute bottom-[-5%] left-[-10%] w-96 h-96 bg-[#E6D5C3] rounded-full blur-[120px] zen-blob opacity-40"></div>
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-xl font-bold tracking-tighter text-[#2C3330] mb-12">PULSE-POST</h1>
                    <h2 className="text-6xl font-bold text-[#2C3330] leading-tight mb-6">Begin your journey.</h2>
                    <p className="text-lg text-[#2C3330]/70 leading-relaxed">
                        Join over 50,000 creators who have chosen a calmer, more intentional way to connect.
                    </p>
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-20 bg-white h-full overflow-y-auto">
                <div className="max-w-md w-full mx-auto py-4">
                    <div className="mb-8">
                        <h3 className="text-3xl font-bold text-[#2C3330] mb-2">Create Account</h3>
                        <p className="text-[#707774] text-sm">Join the new era of creator connection.</p>
                    </div>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] mb-2">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                className={`w-full bg-[#F8F7F4] border ${errors.name ? 'border-red-500' : 'border-[#E8E4DF]'} rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-sm`}
                                onChange={handleChange}
                            />
                            {errors.name && <p className="text-[10px] text-red-500 mt-1 font-bold italic">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] mb-2">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                className={`w-full bg-[#F8F7F4] border ${errors.email ? 'border-red-500' : 'border-[#E8E4DF]'} rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-sm`}
                                onChange={handleChange}
                            />
                            {errors.email && <p className="text-[10px] text-red-500 mt-1 font-bold italic">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] mb-2">Password</label>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className={`w-full bg-[#F8F7F4] border ${errors.password ? 'border-red-500' : 'border-[#E8E4DF]'} rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-sm`}
                                onChange={handleChange}
                            />
                            {errors.password && <p className="text-[10px] text-red-500 mt-1 font-bold italic">{errors.password}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#526D62] hover:bg-[#43594f] text-white font-bold py-4 rounded-2xl shadow-lg shadow-sage-900/10 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 text-sm"
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </button>
                    </form>
                    <p className="mt-8 text-center text-xs text-[#707774]">
                        Already a creator? <Link to="/login" className="text-[#2C3330] font-bold hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
export default Register;