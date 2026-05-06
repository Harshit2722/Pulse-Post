import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user, socket, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Hello, {user?.username} 👋
                    </h1>
                    <button 
                        onClick={logout}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg transition-all"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <h2 className="text-xl font-semibold mb-4">System Status</h2>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${socket ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
                        <p className="text-gray-300">
                            Real-time Engine: <span className="font-mono text-blue-400">{socket ? "CONNECTED" : "DISCONNECTED"}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
