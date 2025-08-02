'use client';

import { useState, useRef, useId } from 'react';
import { useChat } from '@/hooks/useChat';
import { Toaster } from 'react-hot-toast';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionId = useId();
  const userId = 'demo-user'; // Replace with actual user ID from auth

  const {
    handleChat,
    handleStopChat,
    isStopChat,
    currentChat,
    setCurrentChat,
    isChatLoading,
    isStreaming,
  } = useChat({
    userId,
    sessionId,
    setQuery,
    chatContainerRef: chatContainerRef as React.RefObject<HTMLDivElement>,
    needLogin: false, // Set to true if authentication is required
    apiPath: '/vi_trader', // Your backend endpoint
    extraParams: {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isChatLoading) {
      await handleChat(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const clearChat = () => {
    setCurrentChat([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster position="top-center" />

      <div className="border-b border-border bg-card px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Chat</h1>
          <button
            onClick={clearChat}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentChat.length === 0}
          >
            清除對話
          </button>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {currentChat.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p>開始與 AI 對話吧！</p>
            </div>
          )}

          {currentChat.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'human' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'human' ? 'order-2' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${message.role === 'human' ? 'text-primary' : 'text-accent-foreground'
                    }`}>
                    {message.role === 'human' ? '你' : 'AI'}
                  </span>
                  {message.type !== 'text' && (
                    <span className="text-xs text-muted-foreground">
                      {message.type}
                    </span>
                  )}
                </div>

                <div className={`rounded-lg px-4 py-3 ${message.role === 'human'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
                  }`}>
                  {message.type === 'text' && (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  {message.type === 'tool_use' && (
                    <div className="space-y-2">
                      <span className="font-medium">使用工具: {message.tool_name}</span>
                      {message.tool_args && (
                        <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
                          {JSON.stringify(message.tool_args, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                  {message.type === 'tool_result' && message.tool_result && (
                    <div className="space-y-2">
                      <span className="font-medium">工具結果: {message.tool_name}</span>
                      <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
                        {JSON.stringify(message.tool_result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 p-3 bg-accent/10 rounded-lg">
                    <span className="text-sm font-medium text-accent-foreground">參考來源:</span>
                    <div className="mt-1 space-y-1">
                      {message.sources.map((source: any, idx: number) => (
                        <div key={idx} className="text-sm text-muted-foreground">
                          • {source.title || source.name || `來源 ${idx + 1}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {message.prompts && message.prompts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">建議問題:</span>
                    <div className="flex flex-wrap gap-2">
                      {message.prompts.map((prompt: string, idx: number) => (
                        <button
                          key={idx}
                          className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                          onClick={() => setQuery(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isStreaming &&
                  index === currentChat.length - 1 &&
                  message.role === 'ai' &&
                  message.content === '' && (
                    <div className="flex gap-1 mt-2">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border bg-card px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入您的問題..."
              className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
              disabled={isChatLoading}
            />
            {isStreaming && (
              <button
                type="button"
                onClick={handleStopChat}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
              >
                停止
              </button>
            )}
            <button
              type="submit"
              disabled={isChatLoading || !query.trim()}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              發送
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}