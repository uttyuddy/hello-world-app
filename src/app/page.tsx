'use client';

import React, { useState, useRef, useEffect } from 'react';
import MathText from '@/components/MathText';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string; // Date型からstring型に変更
}

export default function Home() {
  // クライアントサイドのレンダリングを制御するstate
  const [isClient, setIsClient] = useState(false);
  
  // 初期メッセージの設定
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'こんにちは！二次方程式 $ax^2 + bx + c = 0$ の解の公式は $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ です。数式を含むメッセージが送れます。',
      sender: 'bot',
      timestamp: '', // 空文字列で初期化
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // クライアントサイドでのみ実行されるeffect
  useEffect(() => {
    // クライアントサイドでレンダリングされたことをマーク
    setIsClient(true);
    
    // 初期メッセージのタイムスタンプを設定
    setMessages(prevMessages => 
      prevMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || formatTime(new Date())
      }))
    );
  }, []);

  // 新しいメッセージが追加された際に自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // キーボード表示時に画面下部へスクロール
  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement === inputRef.current) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 時間をフォーマットするヘルパー関数
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
  
    // ユーザーメッセージを作成
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: formatTime(new Date()),
    };
  
    // 最新のメッセージ履歴を生成して状態更新
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
  
    try {
      // 最新のボットメッセージを取得
      const latestBotMessage = [...messages]
        .reverse()
        .find(msg => msg.sender === 'bot')?.content || '';
  
      // APIルートへPOSTリクエストを送信
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newUserMessage.content,
          ai_message: latestBotMessage, // 最新のボットメッセージを送信
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
      setMessages((prev) => [...prev, botResponse]);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '予期しないエラー';
      console.error('Error:', errMsg);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'エラーが発生しました。再度お試しください。',
        sender: 'bot',
        timestamp: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, errorResponse]);
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

  // クライアントサイドでのレンダリングかどうかでメッセージの表示方法を調整
  const renderTimestamp = (message: Message) => {
    if (!isClient) return null;
    
    return (
      <span className="text-xs opacity-70 block mt-1">
        {message.timestamp}
      </span>
    );
  };

// メッセージエリアの部分修正（コンポーネント内部のみ抜粋）
return (
  <div className="flex flex-col h-screen">
    {/* ヘッダー - 固定位置に */}
    <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
      <h1 className="text-xl font-bold">チャットアプリ</h1>
    </header>

    {/* メッセージエリア - flex-growでスペースを確保し、オーバーフロー時はスクロール */}
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs sm:max-w-sm md:max-w-md p-3 rounded-lg ${
              message.sender === 'user'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-bl-none shadow'
            }`}
          >
            <p className="text-sm">
              <MathText text={message.content} />
            </p>
            {renderTimestamp(message)}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-200 p-3 rounded-lg flex space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* 入力エリア - 画面下部に固定 */}
    <div className="border-t border-gray-300 bg-white p-2 sticky bottom-0 z-10">
      <div className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="bg-blue-500 text-white p-2 rounded-full disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 transform rotate-90"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
);
}