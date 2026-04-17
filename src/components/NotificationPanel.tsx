// src/components/NotificationPanel.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bell, X, FileText, MessageCircle, AtSign, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  surgeon_name: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const typeIcon = (type: string) => {
  if (type === 'file_upload') return <FileText size={18} className="text-teal-600" />;
  if (type === 'message_reply') return <MessageCircle size={18} className="text-blue-600" />;
  if (type === 'mention') return <Bell size={18} className="text-purple-600" />;
  return <Bell size={18} className="text-gray-600" />;
};

const typeColor = (type: string) => {
  if (type === 'file_upload') return 'bg-teal-50 border-teal-200';
  if (type === 'message_reply') return 'bg-blue-50 border-blue-200';
  if (type === 'mention') return 'bg-purple-50 border-purple-200';
  return 'bg-gray-50 border-gray-200';
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

// ✅ Clean message — strip @mentions from display
const cleanMessage = (message: string) =>
  message.replace(/@\w+/g, '').trim();

export default function NotificationPanel({ user, onClose }: { user: any; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('notifications-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('surgeon_name', user.username)
      .order('created_at', { ascending: false });

    setNotifications(data || []);

    // Mark all as read when panel opens
    if (data && data.length > 0) {
      const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        setNotifications(prev =>
          prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: true } : n)
        );
      }
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#00938e] to-teal-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bell size={28} />
            <div>
              <h2 className="text-2xl font-bold">Notifications</h2>
              <p className="text-teal-100 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg"
              >
                <CheckCheck size={16} /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border-2 flex gap-4 items-start transition-all ${typeColor(notif.type)} ${!notif.is_read ? 'shadow-sm' : 'opacity-75'}`}
              >
                <div className="mt-0.5 shrink-0">{typeIcon(notif.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm">{notif.title}</p>
                    {!notif.is_read && (
                      <span className="shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1.5" />
                    )}
                  </div>
                  {/* ✅ @mentions stripped from message */}
                  <p className="text-gray-600 text-sm mt-1">{cleanMessage(notif.message)}</p>
                  <p className="text-gray-400 text-xs mt-2">{formatTime(notif.created_at)}</p>
                </div>

                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="shrink-0 text-gray-300 hover:text-red-400 transition-colors mt-0.5"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}