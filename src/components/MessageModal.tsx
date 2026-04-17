// src/components/MessageModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Send, X, MessageCircle, AtSign } from 'lucide-react';

interface Message {
  id: string;
  surgeon_name: string;
  message: string;
  reply: string | null;
  sent_at: string;
  replied_at: string | null;
  status: string;
}

export default function MessageModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [surgeonList, setSurgeonList] = useState<string[]>([]);
  const [mentionDropdown, setMentionDropdown] = useState<string[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const isSupport = user?.isSupport;

  useEffect(() => {
    loadMessages();
    if (isSupport) loadSurgeons();

    const channel = supabase
      .channel('messages-modal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadMessages)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadSurgeons = async () => {
    const { data } = await supabase
      .from('surgeries')
      .select('surgeon_name');
    const unique = [...new Set((data || []).map((s: any) => s.surgeon_name))].filter(Boolean);
    setSurgeonList(unique as string[]);
  };

  const loadMessages = async () => {
    const query = isSupport
      ? supabase.from('messages').select('*').order('sent_at', { ascending: false })
      : supabase.from('messages').select('*').eq('surgeon_name', user.username).order('sent_at', { ascending: false });

    const { data } = await query;
    setMessages(data || []);

    if (!isSupport && data) {
      const unseenIds = data.filter(m => m.status === 'replied').map(m => m.id);
      if (unseenIds.length > 0) {
        await supabase.from('messages').update({ status: 'seen' }).in('id', unseenIds);
        setMessages(prev => prev.map(m => unseenIds.includes(m.id) ? { ...m, status: 'seen' } : m));
      }
    }

    if (isSupport && data) {
      const unseenIds = data.filter(m => m.status === 'pending').map(m => m.id);
      if (unseenIds.length > 0) {
        await supabase.from('messages').update({ status: 'pending_seen' }).in('id', unseenIds);
        setMessages(prev => prev.map(m => unseenIds.includes(m.id) ? { ...m, status: 'pending_seen' } : m));
      }
    }
  };

  // Handle @mention typing in reply box
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);

    const atIndex = val.lastIndexOf('@');
    if (atIndex !== -1) {
      const search = val.slice(atIndex + 1).toLowerCase();
      setMentionSearch(search);
      const filtered = surgeonList.filter(s => s.toLowerCase().includes(search));
      setMentionDropdown(filtered);
    } else {
      setMentionDropdown([]);
    }
  };

  const insertMention = (name: string) => {
    const atIndex = replyText.lastIndexOf('@');
    const newText = replyText.slice(0, atIndex) + `@${name} `;
    setReplyText(newText);
    setMentionDropdown([]);
    replyRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await supabase.from('messages').insert({
      surgeon_name: user.username,
      message: newMessage,
      status: 'pending'
    });
    setNewMessage('');
    loadMessages();
  };

  const sendReply = async (id: string, surgeonName: string) => {
    if (!replyText.trim()) return;

    await supabase
      .from('messages')
      .update({ reply: replyText, replied_at: new Date().toISOString(), status: 'replied' })
      .eq('id', id);

    // ✅ Auto notification to surgeon on reply
    await supabase.from('notifications').insert({
      surgeon_name: surgeonName,
      title: 'New Reply from Support',
      message: replyText.length > 100 ? replyText.slice(0, 100) + '...' : replyText,
      type: 'message_reply',
      is_read: false
    });

    // ✅ Check for @mentions and send personal notifications
    const mentions = replyText.match(/@(\w+)/g);
    if (mentions) {
      for (const mention of mentions) {
        const mentionedName = mention.slice(1);
        const matchedSurgeon = surgeonList.find(
          s => s.toLowerCase() === mentionedName.toLowerCase()
        );
        if (matchedSurgeon && matchedSurgeon !== surgeonName) {
          await supabase.from('notifications').insert({
            surgeon_name: matchedSurgeon,
            title: `You were mentioned by Support`,
            message: replyText.length > 100 ? replyText.slice(0, 100) + '...' : replyText,
            type: 'mention',
            is_read: false
          });
        }
      }
    }

    setReplyText('');
    setReplyTo(null);
    loadMessages();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#00938e] to-teal-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <MessageCircle size={28} /> Message Center
          </h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No messages yet</p>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`p-5 rounded-xl border-2 ${
                  msg.status === 'pending' || msg.status === 'pending_seen'
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200'
                }`}
              >
                <p className="font-bold text-[#00938e]">{msg.surgeon_name}</p>
                <p className="mt-2 text-gray-700">{msg.message}</p>

                {msg.reply && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="font-semibold text-blue-800">Support Reply:</p>
                    <p className="text-gray-700">{msg.reply}</p>
                  </div>
                )}

                {isSupport && (msg.status === 'pending' || msg.status === 'pending_seen') && (
                  <button
                    onClick={() => setReplyTo(msg.id)}
                    className="mt-3 bg-[#F4BB44] text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Reply
                  </button>
                )}

                {replyTo === msg.id && isSupport && (
                  <div className="mt-3 relative">
                    {isSupport && (
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <AtSign size={12} /> Type @ to mention a surgeon
                      </p>
                    )}
                    <textarea
                      ref={replyRef}
                      value={replyText}
                      onChange={handleReplyChange}
                      className="w-full p-3 border rounded-lg focus:border-[#00938e] focus:outline-none"
                      rows={3}
                      placeholder="Type reply... use @name to mention a surgeon"
                    />

                    {/* @mention dropdown */}
                    {mentionDropdown.length > 0 && (
                      <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-64 max-h-40 overflow-y-auto">
                        {mentionDropdown.map(name => (
                          <button
                            key={name}
                            onClick={() => insertMention(name)}
                            className="w-full text-left px-4 py-2 hover:bg-teal-50 text-sm flex items-center gap-2"
                          >
                            <AtSign size={14} className="text-[#00938e]" />
                            {name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => sendReply(msg.id, msg.surgeon_name)}
                        className="bg-[#00938e] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Send size={16} /> Send
                      </button>
                      <button
                        onClick={() => { setReplyTo(null); setReplyText(''); setMentionDropdown([]); }}
                        className="text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Send Box — Surgeon Only */}
        {!isSupport && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message to support..."
                className="flex-1 px-4 py-3 border rounded-xl focus:border-[#00938e] focus:outline-none"
              />
              <button onClick={sendMessage} className="bg-[#00938e] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:shadow-lg">
                <Send size={20} /> Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}