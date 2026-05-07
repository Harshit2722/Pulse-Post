import { useState } from 'react';
import { loginUser } from '../utils/axios';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth} from '../context/AuthContext';
const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { login } = useAuth();
    const validate = () => {
        const errors = {};
        if (!form.email) errors.email = "Email is required";
        if (!form.password) errors.password = "Password is required";
        setErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if(errors[name]) setErrors(prev => ({...prev, [name]: ""}));
    }
    const submit = async (e) => {
        e.preventDefault();
        if(!validate()) return;
        setLoading(true);
        try {
            const { data } = await loginUser(form);
            const {token,user} = data.data;
            login(user, token);
            toast.success("Welcome back! ⚡");
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="h-screen w-screen flex bg-white font-['Instrument_Sans'] overflow-hidden">
            
            {/* LEFT HERO SECTION */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#E6D5C3] p-16 flex-col justify-center relative overflow-hidden h-full">
                
                {/* FLOATING STARS */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <span className="zen-drifter" style={{ left: '5%', animationDuration: '12s' }}>✦</span>
                    <span className="zen-drifter" style={{ left: '25%', animationDuration: '18s', animationDelay: '2s' }}>✧</span>
                    <span className="zen-drifter" style={{ left: '45%', animationDuration: '15s', animationDelay: '5s' }}>✦</span>
                    <span className="zen-drifter" style={{ left: '65%', animationDuration: '22s', animationDelay: '1s' }}>✧</span>
                    <span className="zen-drifter" style={{ left: '85%', animationDuration: '19s', animationDelay: '8s' }}>✦</span>
                </div>
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#DAE2DF] rounded-full blur-[100px] zen-blob opacity-60"></div>
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-xl font-bold tracking-tighter text-[#2C3330] mb-12">PULSE-POST</h1>
                    <h2 className="text-6xl font-bold text-[#2C3330] leading-tight mb-6">Connecting with Intention.</h2>
                    <p className="text-lg text-[#2C3330]/70 leading-relaxed">
                        Join a community built on shared connection, slow living, and shared tranquility.
                    </p>
                </div>
            </div>
            {/* RIGHT FORM SECTION */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-20 bg-white h-full overflow-y-auto">
                <div className="max-w-md w-full mx-auto py-8">
                    <div className="mb-10">
                        <h3 className="text-3xl font-bold text-[#2C3330] mb-2">Welcome Back</h3>
                        <p className="text-[#707774] text-sm">Sign in to your creator feed.</p>
                    </div>
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] mb-3">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="hello@example.com"
                                className={`w-full bg-[#F8F7F4] border ${errors.email ? 'border-red-500' : 'border-[#E8E4DF]'} rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-sm`}
                                onChange={handleChange}
                            />
                            {errors.email && <p className="text-[10px] text-red-500 mt-2 font-bold italic">{errors.email}</p>}
                        </div>
                        <div>
                            <div className="flex justify-between mb-3">
                                <label className="text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em]">Password</label>
                                <button type="button" className="text-[10px] font-bold text-[#707774] hover:text-[#526D62] uppercase tracking-widest">Forgot?</button>
                            </div>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className={`w-full bg-[#F8F7F4] border ${errors.password ? 'border-red-500' : 'border-[#E8E4DF]'} rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-sm`}
                                onChange={handleChange}
                            />
                            {errors.password && <p className="text-[10px] text-red-500 mt-2 font-bold italic">{errors.password}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#526D62] hover:bg-[#43594f] text-white font-bold py-4 rounded-2xl shadow-lg shadow-sage-900/10 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 text-sm"
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>
                    <p className="mt-10 text-center text-xs text-[#707774]">
                        New here? <Link to="/register" className="text-[#2C3330] font-bold hover:underline">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
export default Login;