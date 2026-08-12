import { useChatStore } from '../stores/chatStore';

export const useChat = () => {
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation, 
    createNewConversation, 
    updateConversationTitle, 
    deleteConversation, 
    addMessage, 
    clearConversations 
  } = useChatStore();
  
  const startNewChat = () => {
    return createNewConversation();
  };
  
  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
  };
  
  const sendMessage = (content) => {
    if (!currentConversation) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    addMessage(currentConversation.id, userMessage);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This is a simulated response to: "${content}". In a real app, this would come from an AI API.`,
        timestamp: new Date().toISOString(),
      };
      addMessage(currentConversation.id, aiMessage);
    }, 1000);
  };
  
  return {
    conversations,
    currentConversation,
    startNewChat,
    selectConversation,
    updateConversationTitle,
    deleteConversation,
    sendMessage,
    clearConversations,
  };
};