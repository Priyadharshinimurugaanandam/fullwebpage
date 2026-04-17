import React, { useState, useEffect } from 'react';
import MessageModal from './MessageModal';
import { Mail } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Header: React.FC<{ user: any }> = ({ user }) => {
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    window.location.href = '/';
  };

  // 🔔 Load unread messages
  const loadUnread = async () => {
    let query;

    if (user?.isSupport) {
      query = supabase
        .from('messages')
        .select('id')
        .eq('status', 'pending'); // unread for support
    } else {
      query = supabase
        .from('messages')
        .select('id')
        .eq('surgeon_name', user.username)
        .eq('status', 'replied'); // unread for surgeon
    }

    const { data } = await query;
    setUnreadCount(data?.length || 0);
  };

  // 🔄 Realtime sync
  useEffect(() => {
    loadUnread();

    const channel = supabase
      .channel('messages-header')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => loadUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 h-16 border-b border-gray-200">
        <div className="flex items-center h-full px-8 justify-between">

          {/* LEFT: LOGO + TITLE */}
          <div className="flex items-center">
            <img 
              src="/placeholder.png" 
              alt="MISSO System Insights Logo" 
              className="w-9 h-9 mr-3 object-contain rounded-md shadow-sm"
              onError={(e) => {
                e.currentTarget.src = '/holder.png';
              }}
            />
            <h1 className="text-2xl font-bold text-[#00938e] uppercase tracking-wider">
              MIZZO SYSTEM INSIGHTS
            </h1>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-6">

            {/* USER INFO */}
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500 font-medium">Logged in as</p>
              <p className="font-bold text-gray-800 text-sm">{user.username}</p>
            </div>

            {/* MESSAGE ICON */}
            <button
              onClick={() => setShowInbox(true)}
              className="relative p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110"
              title="Messages"
            >
              <Mail size={22} className="text-[#00938e]" />

              {/* 🔴 Dynamic Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="bg-[#00938e] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-all hover:shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MESSAGE MODAL */}
      {showInbox && (
        <MessageModal
          user={user}
          onClose={() => {
            setShowInbox(false);
            loadUnread(); // 🔄 refresh badge immediately after closing
          }}
        />
      )}
    </>
  );
};

export default Header;