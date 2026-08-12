import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Plus, Trash2, Clock, User, Bot, Send, ChevronLeft, Loader2, Mic } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';

const ChatPage = () => {
  const { conversations, currentConversation, isLoading, fetchConversations, fetchMessages, createNewConversation, sendMessage, deleteConversation, setCurrentConversation } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      fetchConversations(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const filteredConversations = conversations.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!messageInput.trim() || !user || sending) return;
    const msg = messageInput;
    setMessageInput('');

    if (!currentConversation) {
      const newConv = await createNewConversation(user.id, msg);
      if (newConv) {
        setCurrentConversation(newConv);
        setSending(true);
        await sendMessage(user.id, newConv.id, msg);
        setSending(false);
      }
    } else {
      setSending(true);
      await sendMessage(user.id, currentConversation.id, msg);
      setSending(false);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    const newConv = await createNewConversation(user.id);
    if (newConv) {
      setCurrentConversation(newConv);
      setShowMobileList(false);
    }
  };

  const handleSelectConversation = async (conv) => {
    setCurrentConversation(conv);
    setShowMobileList(false);
    if (!conv.messages || conv.messages.length === 0) {
      await fetchMessages(conv.id);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteConversation(id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleVoiceInput = async () => {
    if (isListening) return;
    setIsListening(true);
    try {
      const res = await fetch('http://localhost:8000/voice/listen', { method: 'POST' });
      const data = await res.json();
      if (data.text) {
        setMessageInput(data.text);
      }
    } catch (err) {
      console.error('Voice input failed:', err);
    } finally {
      setIsListening(false);
    }
  };

  const timeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="h-full flex overflow-hidden">
      <AnimatePresence>
        {(showMobileList || !currentConversation) && (
          <motion.div
            initial={false}
            animate={{ width: 320 }}
            exit={{ width: 0 }}
            className="flex-shrink-0 border-r border-[var(--glass-border)] overflow-hidden"
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Chats</h2>
                  <motion.button
                    onClick={handleNewChat}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--bg-primary)]"
                  >
                    <Plus size={18} />
                  </motion.button>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/8 text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[var(--text-secondary)]">No conversations yet</p>
                    <motion.button
                      onClick={handleNewChat}
                      whileHover={{ scale: 1.02 }}
                      className="mt-2 text-sm text-[var(--accent)] hover:underline"
                    >
                      Start a new chat
                    </motion.button>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredConversations.map((conversation) => (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          currentConversation?.id === conversation.id
                            ? 'bg-gradient-to-r gradient-accent-15 border border-accent-25 border-l-2 border-l-[var(--accent)]'
                            : 'hover:bg-white/5 border border-transparent border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            currentConversation?.id === conversation.id
                              ? 'bg-gradient-to-br gradient-accent-30'
                              : 'bg-white/5'
                          }`}>
                            <MessageSquare size={16} className="text-[var(--accent)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{conversation.title}</p>
                              <button
                                onClick={(e) => handleDelete(e, conversation.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-danger-10 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{conversation.preview}</p>
                            <p className="text-[10px] text-text-secondary-60 mt-1 flex items-center gap-1">
                              <Clock size={10} /> {timeAgo(conversation.updated_at || conversation.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
        {currentConversation ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-border)]">
              {!showMobileList && (
                <button onClick={() => setShowMobileList(true)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
                </button>
              )}
              <div className="p-2 rounded-lg bg-gradient-to-br gradient-accent-20">
                <Bot size={18} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{currentConversation.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{(currentConversation.messages?.length || currentConversation.message_count) || 0} messages</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {(!currentConversation.messages || currentConversation.messages.length === 0) ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br gradient-accent-20 flex items-center justify-center">
                      <Bot size={28} className="text-[var(--accent)]" />
                    </div>
                    <p className="text-[var(--text-primary)] font-medium text-lg">Hello! Main SONIC AI hoon. Aaj aapko kya karna hai?</p>
                    <p className="text-[var(--text-secondary)] text-sm">Neeche message type karein aur command dein.</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {(currentConversation.messages || []).map((message, i) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot size={16} className="text-[var(--bg-primary)]" />
                        </div>
                      )}
                      <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                        <div className={`p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-[var(--glass)] border border-[var(--glass-border)]'
                            : 'bg-gradient-to-br gradient-accent-10 border border-accent-20'
                        }`}>
                          <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className={`text-[10px] text-text-secondary-60 mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent)] flex items-center justify-center flex-shrink-0 mt-1">
                          <User size={16} className="text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-[var(--bg-primary)]" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br gradient-accent-10 border border-accent-20">
                    <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-[var(--glass-border)]">
              <div className="flex items-end gap-2">
                <motion.button
                  onClick={handleVoiceInput}
                  disabled={isListening}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Voice input"
                  className={`p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-gradient-to-r from-[var(--success)] to-[#00cc6a] text-white animate-pulse'
                      : 'bg-white/5 border border-white/8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isListening ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
                </motion.button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-white/8 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] resize-none transition-all"
                    style={{ minHeight: 48, maxHeight: 120 }}
                  />
                </div>
                <motion.button
                  onClick={handleSend}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!messageInput.trim() || sending}
                  className="p-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br gradient-accent-20 flex items-center justify-center">
                <MessageSquare size={36} className="text-[var(--accent)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">No Conversation Selected</h3>
              <p className="text-[var(--text-secondary)] max-w-sm">Choose a conversation from the sidebar or start a new one</p>
              <motion.button
                onClick={handleNewChat}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--bg-primary)] font-semibold"
              >
                <Plus size={20} /> New Chat
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;