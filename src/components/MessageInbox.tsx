// src/components/MessageInbox.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Send, MessageCircle, Bell } from 'lucide-react';

interface Message {
  id: string;
  surgeon_name: string;
  message: string;
  reply: string | null;
  sent_at: string;
  replied_at: string | null;
  status: string;
  is_read_by_surgeon: boolean;
}

export default function MessageInbox({ currentUser }: { currentUser: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const isSupport = currentUser?.isSupport;

  // Load messages
  useEffect(() => {
    loadMessages();

    // Real-time listener
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const loadMessages = async () => {
    if (isSupport) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('sent_at', { ascending: false });
      setMessages(data || []);
    } else {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('surgeon_name', currentUser.username)
        .order('sent_at', { ascending: false });
      setMessages(data || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await supabase.from('messages').insert({
      surgeon_name: currentUser.username,
      message: newMessage,
      status: 'pending'
    });
    setNewMessage('');
  };

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    await supabase
      .from('messages')
      .update({
        reply: replyText,
        replied_at: new Date().toISOString(),
        status: 'replied',
        is_read_by_surgeon: false
      })
      .eq('id', id);
    setReplyText('');
    setReplyTo(null);
  };

  const unreadCount = messages.filter(m => 
    isSupport ? m.status === 'pending' : (m.status === 'replied' && !m.is_read_by_surgeon)
  ).length;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="text-[#00938e]" size={32} />
        <h2 className="text-3xl font-bold text-gray-800">Messages {unreadCount > 0 && <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">{unreadCount}</span>}</h2>
      </div>

      {/* Send Message (Surgeon Only) */}
      {!isSupport && (
        <div className="mb-8 p-6 bg-teal-50 rounded-xl border-2 border-[#00938e]">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your query or message to support team..."
            className="w-full p-4 rounded-lg border border-gray-300 focus:border-[#00938e] focus:ring-4 focus:ring-teal-100"
            rows={3}
          />
          <button
            onClick={sendMessage}
            className="mt-3 bg-[#00938e] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-lg"
          >
            <Send size={20} /> Send Message
          </button>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No messages yet</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`p-5 rounded-xl border-2 ${msg.status === 'pending' && !isSupport ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'} ${msg.status === 'replied' && !isSupport && !msg.is_read_by_surgeon ? 'border-green-400 bg-green-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold text-[#00938e]">{msg.surgeon_name}</p>
                  <p className="mt-2 text-gray-700">{msg.message}</p>
                  {msg.reply && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="font-semibold text-blue-800">Support Reply:</p>
                      <p className="text-gray-700">{msg.reply}</p>
                    </div>
                  )}
                </div>
                {isSupport && msg.status === 'pending' && (
                  <button
                    onClick={() => setReplyTo(msg.id)}
                    className="ml-4 bg-[#F4BB44] text-white px-4 py-2 rounded-lg hover:shadow-lg"
                  >
                    Reply
                  </button>
                )}
              </div>

              {replyTo === msg.id && isSupport && (
                <div className="mt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => sendReply(msg.id)} className="bg-[#00938e] text-white px-5 py-2 rounded-lg">Send Reply</button>
                    <button onClick={() => { setReplyTo(null); setReplyText(''); }} className="text-gray-600">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}