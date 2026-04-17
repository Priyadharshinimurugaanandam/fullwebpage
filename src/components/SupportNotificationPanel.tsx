// src/components/SupportNotificationPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bell, X, Send, AtSign, CheckCircle, Clock } from 'lucide-react';

interface SentNotification {
  id: string;
  surgeon_name: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

export default function SupportNotificationPanel({ onClose }: { onClose: () => void }) {
  const [surgeonList, setSurgeonList] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [mentionDropdown, setMentionDropdown] = useState<string[]>([]);
  const [mentionedSurgeons, setMentionedSurgeons] = useState<string[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'sent'>('compose');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSurgeons();
    loadSentNotifications();
  }, []);

  const loadSurgeons = async () => {
    const { data } = await supabase.from('surgeries').select('surgeon_name');
    const unique = [...new Set((data || []).map((s: any) => s.surgeon_name))].filter(Boolean);
    setSurgeonList(unique as string[]);
  };

  const loadSentNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'mention')
      .order('created_at', { ascending: false })
      .limit(50);
    setSentNotifications(data || []);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    // Find all @mentions already completed in text
    const allMentions = [...val.matchAll(/@(\w+\s)/g)].map(m => m[1].trim());
    const matched = surgeonList.filter(s =>
      allMentions.some(m => s.toLowerCase() === m.toLowerCase())
    );
    setMentionedSurgeons([...new Set(matched)]);

    // Show dropdown for currently typing @mention
    const atIndex = val.lastIndexOf('@');
    if (atIndex !== -1) {
      const afterAt = val.slice(atIndex + 1);
      if (!afterAt.includes(' ')) {
        const filtered = surgeonList.filter(s =>
          s.toLowerCase().includes(afterAt.toLowerCase())
        );
        setMentionDropdown(filtered);
      } else {
        setMentionDropdown([]);
      }
    } else {
      setMentionDropdown([]);
    }
  };

  const insertMention = (name: string) => {
    const atIndex = message.lastIndexOf('@');
    const newText = message.slice(0, atIndex) + `@${name} `;
    setMessage(newText);
    setMentionDropdown([]);
    if (!mentionedSurgeons.includes(name)) {
      setMentionedSurgeons(prev => [...prev, name]);
    }
    textareaRef.current?.focus();
  };

  // ✅ Recipients: mentioned surgeons OR all surgeons if none mentioned
  const recipients = mentionedSurgeons.length > 0 ? mentionedSurgeons : surgeonList;
  const isBroadcast = mentionedSurgeons.length === 0;

const sendNotification = async () => {
  if (!message.trim() || !title.trim()) return;

  setSending(true);

  // 🔥 REMOVE @mentions completely from message before sending
const cleanMessage = (msg: string, mentioned: string[]) => {
  let cleaned = msg;

  for (const name of mentioned) {
    const regex = new RegExp(`@${name}\\s*`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }

  return cleaned.trim();
};

  // Send to each recipient
  for (const surgeon of recipients) {
    await supabase.from('notifications').insert({
      surgeon_name: surgeon,
      title: title,
      message: cleanMessage(message, mentionedSurgeons), // ✅ cleaned message
      type: 'mention',
      is_read: false
    });
  }

  setSending(false);
  setSent(true);
  setMessage('');
  setTitle('');
  setMentionedSurgeons([]);
  loadSentNotifications();

  setTimeout(() => setSent(false), 3000);
};

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#00938e] to-teal-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bell size={28} />
            <div>
              <h2 className="text-2xl font-bold">Send Notification</h2>
              <p className="text-teal-100 text-sm">@mention specific surgeons or send to all</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 pt-3 gap-4">
          {(['compose', 'sent'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-semibold capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-[#00938e] text-[#00938e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'compose' ? '✏️ Compose' : `📋 Sent (${sentNotifications.length})`}
            </button>
          ))}
        </div>

        {/* COMPOSE TAB */}
        {activeTab === 'compose' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                Notification Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Important Update, Scheduled Maintenance..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#00938e] focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {/* Message */}
            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                Message
                <span className="text-gray-400 font-normal ml-1">
                  (optional: @name to send to specific surgeons)
                </span>
              </label>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleMessageChange}
                rows={5}
                placeholder="Type your message... Leave without @mention to send to ALL surgeons, or @surgeonname for specific ones"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#00938e] focus:outline-none focus:ring-2 focus:ring-teal-100 resize-none"
              />

              {/* @mention dropdown */}
              {mentionDropdown.length > 0 && (
                <div className="absolute z-10 bg-white border border-gray-200 rounded-xl shadow-xl w-72 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-400 px-3 pt-2 pb-1">Surgeons</p>
                  {mentionDropdown.map(name => (
                    <button
                      key={name}
                      onClick={() => insertMention(name)}
                      className="w-full text-left px-4 py-2.5 hover:bg-teal-50 text-sm flex items-center gap-2 transition-colors"
                    >
                      <AtSign size={14} className="text-[#00938e]" />
                      <span className="font-medium">{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recipients Preview */}
            <div className={`p-4 rounded-xl border-2 ${isBroadcast ? 'bg-yellow-50 border-yellow-200' : 'bg-teal-50 border-teal-200'}`}>
              <p className={`text-sm font-semibold mb-2 ${isBroadcast ? 'text-yellow-800' : 'text-teal-800'}`}>
                {isBroadcast
                  ? `📢 Broadcasting to all ${surgeonList.length} surgeons`
                  : `Will be sent to ${mentionedSurgeons.length} surgeon${mentionedSurgeons.length > 1 ? 's' : ''}:`
                }
              </p>
              <div className="flex flex-wrap gap-2">
                {recipients.map(name => (
                  <span
                    key={name}
                    className={`text-white text-sm px-3 py-1 rounded-full flex items-center gap-1 ${isBroadcast ? 'bg-yellow-500' : 'bg-[#00938e]'}`}
                  >
                    <AtSign size={12} /> {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={sendNotification}
              disabled={sending || !title.trim() || !message.trim()}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                sent
                  ? 'bg-green-500 text-white'
                  : sending || !title.trim() || !message.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#00938e] text-white hover:shadow-lg hover:bg-teal-700'
              }`}
            >
              {sent ? (
                <><CheckCircle size={20} /> Sent Successfully!</>
              ) : sending ? (
                <><Clock size={20} /> Sending...</>
              ) : (
                <><Send size={20} /> {isBroadcast ? `Send to All ${surgeonList.length} Surgeons` : `Send to ${recipients.length} Surgeon${recipients.length > 1 ? 's' : ''}`}</>
              )}
            </button>
          </div>
        )}

        {/* SENT TAB */}
        {activeTab === 'sent' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {sentNotifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No notifications sent yet</p>
              </div>
            ) : (
              sentNotifications.map(notif => (
                <div key={notif.id} className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{notif.title}</p>
                      <p className="text-sm text-[#00938e] font-medium mt-0.5 flex items-center gap-1">
                        <AtSign size={12} /> {notif.surgeon_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notif.is_read ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {notif.is_read ? '✓ Read' : 'Unread'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(notif.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}