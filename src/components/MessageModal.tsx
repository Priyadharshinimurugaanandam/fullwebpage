// src/components/MessageModal.tsx   ← Correct filename
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Send, X, MessageCircle } from 'lucide-react';   // ← Added MessageCircle

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
  const isSupport = user?.isSupport;

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadMessages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadMessages = async () => {
    const query = isSupport
      ? supabase.from('messages').select('*').order('sent_at', { ascending: false })
      : supabase.from('messages').select('*').eq('surgeon_name', user.username).order('sent_at', { ascending: false });

    const { data } = await query;
    setMessages(data || []);
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

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    await supabase
      .from('messages')
      .update({ reply: replyText, replied_at: new Date().toISOString(), status: 'replied' })
      .eq('id', id);
    setReplyText('');
    setReplyTo(null);
    loadMessages();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
              <div key={msg.id} className={`p-5 rounded-xl border-2 ${msg.status === 'pending' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                <p className="font-bold text-[#00938e]">{msg.surgeon_name}</p>
                <p className="mt-2">{msg.message}</p>
                {msg.reply && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="font-semibold text-blue-800">Support Reply:</p>
                    <p>{msg.reply}</p>
                  </div>
                )}
                {isSupport && msg.status === 'pending' && (
                  <button onClick={() => setReplyTo(msg.id)} className="mt-3 bg-[#F4BB44] text-white px-4 py-2 rounded-lg text-sm">
                    Reply
                  </button>
                )}
                {replyTo === msg.id && (
                  <div className="mt-3">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full p-3 border rounded-lg" rows={3} />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => sendReply(msg.id)} className="bg-[#00938e] text-white px-4 py-2 rounded-lg">Send</button>
                      <button onClick={() => { setReplyTo(null); setReplyText(''); }} className="text-gray-600">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Send Box — Only for Surgeons */}
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