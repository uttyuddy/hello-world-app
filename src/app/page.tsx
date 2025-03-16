'use client';

import React, { useState, useRef, useEffect } from 'react';
import MathText from '@/components/MathText';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        '二次方程式 $ax^2 + bx + c = 0$ の解の公式は $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ です。',
      sender: 'bot',
      timestamp: '',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    setMessages(prev =>
      prev.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || formatTime(new Date()),
      }))
    );
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement === inputRef.current) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: formatTime(new Date()),
    };

    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const latestBotMessage =
        [...messages].reverse().find(msg => msg.sender === 'bot')?.content || '';
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newUserMessage.content,
          ai_message: latestBotMessage,
          history: newMessages,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`APIリクエストに失敗しました: ${JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: 'bot',
        timestamp: formatTime(new Date()),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '予期しないエラー';
      console.error('Error:', errMsg);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'エラーが発生しました。再度お試しください。',
        sender: 'bot',
        timestamp: formatTime(new Date()),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderTimestamp = (message: Message) => {
    if (!isClient) return null;
    return (
      <span className="text-xs text-gray-500 mt-1 block">
        {message.timestamp}
      </span>
    );
  };

  return (
    // カード状のコンテナ（最大幅を設定して中央寄せ）
    <div className="flex flex-col max-h-[90vh] w-full max-w-md border rounded-lg shadow-lg overflow-hidden bg-white">
      {/* ヘッダー */}
      <header className="bg-blue-700 text-white py-4 px-6 flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Chat Application</h1>
      </header>

      {/* メッセージエリア */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-5 py-3 rounded-lg shadow ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-bl-none'
                  : 'bg-gray-100 text-gray-800 rounded-tr-none'
              }`}
            >
              <div className="text-sm">
                <MathText text={message.content} />
              </div>
              {renderTimestamp(message)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 入力エリア */}
      <footer className="border-t border-gray-300 p-4">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-blue-700 text-white rounded-full shadow transition duration-200 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 00-1 1v10.586l-3.293-3.293a1 1 0 10-1.414 1.414l5 5a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 14.586V4a1 1 0 00-1-1z"
                clipRule="evenodd"
                transform="rotate(180,10,10)"
              />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
