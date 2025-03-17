// src/components/FallbackMathDisplay.tsx
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

interface FallbackMathDisplayProps {
  formula: string;
  displayMode?: boolean;
}

const FallbackMathDisplay: React.FC<FallbackMathDisplayProps> = ({ formula, displayMode = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchMathImage = async () => {
      try {
        // MathJax API を使用して数式を画像として取得
        // フォーミュラをエンコード
        const encodedFormula = encodeURIComponent(formula);
        
        // MathJax API エンドポイント
        // Google Chart API または CodeCogs など選択肢はいくつかあります
        const apiUrl = `https://chart.googleapis.com/chart?cht=tx&chl=${encodedFormula}`;
        
        // API URLをセット
        setImageUrl(apiUrl);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load math image:', err);
        setError('数式の表示に失敗しました');
        setIsLoading(false);
      }
    };
    
    fetchMathImage();
  }, [formula]);
  
  // ローディング中
  if (isLoading) {
    return <div className="text-gray-400">数式を読み込み中...</div>;
  }
  
  // エラー発生時
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  // 画像表示
  if (imageUrl) {
    return (
      <div className={displayMode ? "py-2 flex justify-center" : "inline-flex items-center"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageUrl} 
          alt={formula} 
          className={`math-image ${displayMode ? 'max-w-full' : 'inline-block'}`}
          style={{ maxHeight: displayMode ? '100px' : '1.2em', verticalAlign: 'middle' }}
          loading="lazy"
        />
      </div>
    );
  }
  
  // どれにも該当しない場合、テキストでフォールバック
  return (
    <span className="font-mono text-gray-700">
      {displayMode ? `$$${formula}$$` : `$${formula}$`}
    </span>
  );
};

export default FallbackMathDisplay;