import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser, registerUser, googleLogin, verifyOtp, resendOtp } from '../utils/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const Auth = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();
    
    // Determine if we are in login or register mode based on URL
    const [isLogin, setIsLogin] = useState(location.pathname === '/login');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [otp, setOtp] = useState('');

    const handleGoogleSuccess = async (tokenResponse) => {
        setLoading(true);
        try {
            // tokenResponse.access_token is what we get from useGoogleLogin (Implicit Flow)
            // But we often prefer idToken for server verification. 
            // However, useGoogleLogin by default gives access_token.
            // Let's use the one that works best with google-auth-library.
            
            const { data } = await googleLogin(tokenResponse.access_token);
            const { token, user } = data.data;
            login(user, token);
            toast.success("Signed in with Google! 🌈");
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || "Google sign-in failed");
        } finally {
            setLoading(false);
        }
    };

    const googleSignIn = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error("Google Sign-In failed"),
    });

    useEffect(() => {
        setIsLogin(location.pathname === '/login');
        setErrors({});
        setIsOtpStep(false);
        setOtp('');
    }, [location.pathname]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.email) newErrors.email = "Email is required";
        if (!isLogin && !form.name.trim()) newErrors.name = "Full Name is required";
        if (!form.password) newErrors.password = "Password is required";
        else if (!isLogin && form.password.length < 6) newErrors.password = "Password must be 6+ characters";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            if (isLogin) {
                const { data } = await loginUser({ email: form.email, password: form.password });
                const { token, user } = data.data;
                login(user, token);
                toast.success("Welcome back! ⚡");
                navigate('/dashboard');
            } else {
                await registerUser(form);
                toast.success("OTP sent to your email! 📧");
                setIsOtpStep(true);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || (isLogin ? "Login failed" : "Registration failed"));
        } finally {
            setLoading(false);
        }
    };

    const submitOTP = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        setLoading(true);
        try {
            await verifyOtp({ email: form.email, otp });
            toast.success("Email verified! Please sign in. 🚀");
            setIsOtpStep(false);
            setOtp('');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        try {
            await resendOtp({ email: form.email });
            toast.success("New OTP sent! 📧");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#F8F7F4] font-['Instrument_Sans'] overflow-hidden p-4">
            
            {/* AUTH CONTAINER CARD */}
            <div className="relative w-full max-w-[1000px] h-[650px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex">
                
                {/* 1. INFO PANEL (Peach) */}
                <div 
                    className={`absolute top-0 w-1/2 h-full bg-[#E6D5C3] p-16 flex flex-col justify-start transition-all duration-700 ease-in-out z-20 ${isLogin ? 'left-0' : 'left-1/2'}`}
                >
                    <div className="flex items-center space-x-3 text-[#2C3330] mb-20">
                        <div className="flex items-center">
                            <div className="w-2.5 h-2.5 bg-[#2C3330] rounded-full"></div>
                            <div className="w-2.5 h-2.5 bg-[#2C3330] rounded-full -ml-1 mt-2"></div>
                            <div className="w-2.5 h-2.5 bg-[#2C3330] rounded-full -ml-1"></div>
                        </div>
                        <span className="text-xl font-black tracking-tighter font-sans uppercase">PULSE-POST</span>
                    </div>
                    
                    <div className="max-w-xs">
                        <h2 className="text-6xl font-bold text-[#2C3330] leading-[1.05] mb-10 tracking-tight">
                            Connecting <br/> with <br/> <span className="text-[#526D62] italic font-serif">Intention.</span>
                        </h2>
                        <p className="text-[#2C3330]/60 text-lg leading-relaxed">
                            {isLogin 
                                ? "Join a community built on organic connection, slow living, and shared tranquility."
                                : "Join over 50,000 creators who have chosen a calmer, more intentional way to connect."
                            }
                        </p>
                    </div>
                </div>

                {/* 2. FORM PANEL (White) */}
                <div 
                    className={`absolute top-0 w-1/2 h-full bg-white p-16 transition-all duration-700 ease-in-out flex flex-col justify-center ${isLogin ? 'left-1/2' : 'left-0'}`}
                >
                    <div className="max-w-sm w-full mx-auto">
                        <div className="mb-10 text-center lg:text-left">
                            <h3 className="text-3xl font-bold text-[#2C3330] mb-2 tracking-tight font-sans">
                                {isLogin ? "Welcome Back" : isOtpStep ? "Verify Email" : "Create Account"}
                            </h3>
                            <p className="text-[#707774] text-sm font-sans">
                                {isLogin ? "Sign in to your organic feed." : isOtpStep ? `We sent a 6-digit code to ${form.email}` : "Join the new era of creator connection."}
                            </p>
                        </div>

                        {isOtpStep ? (
                            <div className="animate-[fadeIn_0.5s_ease-in-out]">
                                <form onSubmit={submitOTP} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] mb-2 ml-1">Verification Code</label>
                                        <input
                                            type="text"
                                            maxLength="6"
                                            placeholder="000000"
                                            className="w-full bg-[#F8F7F4] border border-[#E8E4DF] rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-2xl tracking-[0.5em] text-center font-bold"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#526D62] hover:bg-[#43594f] text-white font-bold py-4 rounded-2xl shadow-lg shadow-sage-900/10 transition-all active:scale-[0.98] disabled:opacity-50 text-sm uppercase tracking-[0.2em]"
                                    >
                                        {loading ? "Verifying..." : "Verify Code"}
                                    </button>
                                </form>
                                <div className="mt-8 text-center space-y-4">
                                    <p className="text-xs text-[#707774]">
                                        Didn't receive the code? 
                                        <button 
                                            onClick={handleResendOTP} 
                                            disabled={resendLoading}
                                            className="ml-2 text-[#2C3330] font-bold hover:underline disabled:opacity-50"
                                        >
                                            {resendLoading ? "Resending..." : "Resend OTP"}
                                        </button>
                                    </p>
                                    <p className="text-xs text-[#707774]">
                                        Wrong email? 
                                        <button 
                                            onClick={() => setIsOtpStep(false)} 
                                            className="ml-2 text-[#2C3330] font-bold hover:underline"
                                        >
                                            Change Email
                                        </button>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 animate-[fadeIn_0.5s_ease-in-out]">
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] ml-1 font-sans">Full Name</label>
                                        <input
                                            name="name"
                                            type="text"
                                            placeholder="John Doe"
                                            className={`w-full bg-[#F8F7F4] border ${errors.name ? 'border-red-500' : 'border-[#E8E4DF]'} rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-sm font-sans`}
                                            value={form.name}
                                            onChange={handleChange}
                                        />
                                        {errors.name && <p className="text-[10px] text-red-500 ml-1 font-sans">{errors.name}</p>}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em] ml-1 font-sans">Email Address</label>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="hello@example.com"
                                        className={`w-full bg-[#F8F7F4] border ${errors.email ? 'border-red-500' : 'border-[#E8E4DF]'} rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-sm font-sans`}
                                        value={form.email}
                                        onChange={handleChange}
                                    />
                                    {errors.email && <p className="text-[10px] text-red-500 ml-1 font-sans">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between ml-1 font-sans">
                                        <label className="text-[10px] font-bold text-[#707774] uppercase tracking-[0.2em]">Password</label>
                                        {isLogin && <button type="button" className="text-[10px] font-bold text-[#707774] hover:text-[#526D62] uppercase tracking-widest transition-colors">Forgot password?</button>}
                                    </div>
                                    <div className="relative">
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={`w-full bg-[#F8F7F4] border ${errors.password ? 'border-red-500' : 'border-[#E8E4DF]'} rounded-2xl px-6 py-4 text-[#2C3330] outline-none focus:border-[#526D62] transition-all text-sm pr-12`}
                                            value={form.password}
                                            onChange={handleChange}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-[#707774] opacity-50 hover:opacity-100 transition-opacity"
                                        >
                                            {showPassword ? "🔒" : "👁️"}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-[10px] text-red-500 ml-1">{errors.password}</p>}
                                </div>

                                {isLogin && (
                                    <div className="flex items-center space-x-2 ml-1">
                                        <input type="checkbox" id="remember" className="w-4 h-4 rounded border-[#E8E4DF] text-[#526D62] focus:ring-[#526D62]" />
                                        <label htmlFor="remember" className="text-[10px] font-bold text-[#707774] uppercase tracking-widest cursor-pointer">Keep me logged in for 30 days</label>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#526D62] hover:bg-[#43594f] text-white font-bold py-4 rounded-2xl shadow-lg shadow-sage-900/10 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 text-sm uppercase tracking-[0.2em]"
                                >
                                    {loading ? (isLogin ? "Signing In..." : "Creating...") : (isLogin ? "Sign In" : "Create Account")}
                                </button>
                            </form>
                        )}

                        {!isOtpStep && (
                            <>
                                <div className="mt-8 flex items-center justify-center space-x-4">
                                    <div className="h-[1px] flex-1 bg-[#F1EFEA]"></div>
                                    <span className="text-[8px] font-black text-[#707774] uppercase tracking-[0.3em]">Or continue with</span>
                                    <div className="h-[1px] flex-1 bg-[#F1EFEA]"></div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => googleSignIn()}
                                        type="button"
                                        className="flex items-center justify-center space-x-2 py-3 px-4 border border-[#E8E4DF] rounded-2xl hover:bg-[#F8F7F4] transition-all group"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18">
                                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.56c-.829.556-1.891.884-3.048.884-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                                            <path d="M3.964 10.733c-.18-.537-.282-1.11-.282-1.733s.102-1.196.282-1.733V4.935H.957A8.996 8.996 0 0 0 0 9c0 1.497.366 2.909.957 4.065l3.007-2.332z" fill="#FBBC05"/>
                                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.057.957 4.935L3.964 7.268C4.672 5.141 6.656 3.58 9 3.58z" fill="#EA4335"/>
                                        </svg>
                                        <span className="text-[10px] font-bold text-[#2C3330] uppercase tracking-widest">Google</span>
                                    </button>
                                    <button type="button" className="flex items-center justify-center space-x-2 py-3 px-4 border border-[#E8E4DF] rounded-2xl hover:bg-[#F8F7F4] transition-all group">
                                        <span className="text-sm text-blue-600 font-bold">f</span>
                                        <span className="text-[10px] font-bold text-[#2C3330] uppercase tracking-widest">Facebook</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {!isOtpStep && (
                            <p className="mt-10 text-center text-[10px] font-bold text-[#707774] uppercase tracking-widest">
                                {isLogin ? "New to PULSE-POST? " : "Already a creator? "}
                                <button 
                                    onClick={() => navigate(isLogin ? '/register' : '/login')} 
                                    className="text-[#2C3330] hover:underline"
                                >
                                    {isLogin ? "Create an account" : "Sign in"}
                                </button>
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Auth;
