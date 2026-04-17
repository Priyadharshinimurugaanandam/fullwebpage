// src/components/Header.tsx
import React, { useState, useEffect } from 'react';
import MessageModal from './MessageModal';
import NotificationPanel from './NotificationPanel';
import SupportNotificationPanel from './SupportNotificationPanel';
import { Mail, Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Header: React.FC<{ user: any }> = ({ user }) => {
  const [showInbox, setShowInbox] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    window.location.href = '/';
  };

  const loadUnreadMessages = async () => {
    let query;
    if (user?.isSupport) {
      query = supabase.from('messages').select('id').eq('status', 'pending');
    } else {
      query = supabase.from('messages').select('id')
        .eq('surgeon_name', user.username)
        .eq('status', 'replied');
    }
    const { data } = await query;
    setUnreadMessages(data?.length || 0);
  };

  const loadUnreadNotifications = async () => {
    if (user?.isSupport) return; // support sends, doesn't receive
    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('surgeon_name', user.username)
      .eq('is_read', false);
    setUnreadNotifications(data?.length || 0);
  };

  useEffect(() => {
    loadUnreadMessages();
    loadUnreadNotifications();

    const channel = supabase
      .channel('header-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadUnreadMessages)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadUnreadNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 h-16 border-b border-gray-200">
        <div className="flex items-center h-full px-8 justify-between">

          {/* LEFT: LOGO + TITLE */}
          <div className="flex items-center">
            <img
              src="/placeholder.png"
              alt="Logo"
              className="w-9 h-9 mr-3 object-contain rounded-md shadow-sm"
              onError={(e) => { e.currentTarget.src = '/holder.png'; }}
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

            {/* 🔔 BELL — Surgeon: view notifications | Support: send notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110"
              title={user?.isSupport ? 'Send Notification' : 'Notifications'}
            >
              <Bell size={22} className="text-[#00938e]" />
              {/* Only show badge for surgeons */}
              {!user?.isSupport && unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* ✉️ MESSAGE ICON */}
            <button
              onClick={() => setShowInbox(true)}
              className="relative p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110"
              title="Messages"
            >
              <Mail size={22} className="text-[#00938e]" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse">
                  {unreadMessages}
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
            loadUnreadMessages();
          }}
        />
      )}

      {/* SURGEON: view notifications | SUPPORT: send notifications */}
      {showNotifications && (
        user?.isSupport
          ? <SupportNotificationPanel onClose={() => setShowNotifications(false)} />
          : <NotificationPanel
              user={user}
              onClose={() => {
                setShowNotifications(false);
                loadUnreadNotifications();
              }}
            />
      )}
    </>
  );
};

export default Header;