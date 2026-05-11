import React, { useState, useEffect, useRef } from 'react';
import { fetchNotifications, deleteNotification, clearAllNotifications } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const NotificationTray = () => {
    const navigate = useNavigate();
    const { user, socket } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const trayRef = useRef(null);

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const { data } = await fetchNotifications();
                setNotifications(data.data);
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        };
        if (user) loadNotifications();
    }, [user]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
            toast(notification.message, { icon: '🔔', id: notification._id });
        };

        socket.on(`notification-${user._id}`, handleNewNotification);

        return () => {
            socket.off(`notification-${user._id}`, handleNewNotification);
        };
    }, [socket, user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (trayRef.current && !trayRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            toast.error("Failed to remove notification");
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Clear all notifications?")) return;
        try {
            await clearAllNotifications();
            setNotifications([]);
            toast.success("Notifications cleared");
        } catch (err) {
            toast.error("Failed to clear notifications");
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={trayRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-[#707774] hover:text-[#2C3330] transition-colors relative group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {notifications.length > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-[#526D62] rounded-full border-2 border-[#F8F7F4]"></div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-[#E8E4DF] overflow-hidden z-[60] animate-in fade-in slide-in-from-top-5 duration-300">
                    <div className="p-5 border-b border-[#F1EFEA] flex items-center justify-between bg-[#F8F7F4]/50">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black uppercase tracking-widest">Activity</h3>
                            <span className="text-[10px] font-bold text-[#707774]">{notifications.length} Total</span>
                        </div>
                        {notifications.length > 0 && (
                            <button 
                                onClick={handleClearAll}
                                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-[#707774] italic text-xs">
                                No activity yet...
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div 
                                    key={n._id} 
                                    onClick={() => n.post && navigate(`/post/${n.post._id || n.post}`)}
                                    className="p-4 hover:bg-[#F8F7F4] transition-colors group relative border-b border-[#F1EFEA] last:border-0 cursor-pointer"
                                >
                                    <div className="flex items-start space-x-3">
                                        <img src={n.sender?.avatar} className="w-8 h-8 rounded-full object-cover border border-[#E8E4DF]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-[#2C3330] leading-snug">
                                                <span className="font-bold">{n.sender?.name}</span> {n.message.replace(n.sender?.name, '').trim()}
                                            </p>
                                            <p className="text-[9px] text-[#707774] mt-1 font-bold uppercase tracking-tighter">
                                                {new Date(n.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDelete(n._id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-[#707774] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {notifications.length > 0 && (
                        <div className="p-3 text-center bg-[#F8F7F4]/30">
                             <p className="text-[9px] font-bold text-[#707774] uppercase tracking-widest">End of Activity</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationTray;
