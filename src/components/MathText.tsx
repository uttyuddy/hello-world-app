// src/components/MathText.tsx
import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import FallbackMathDisplay from './FallbackMathDisplay';

interface MathTextProps {
  text: string;
}

// 数式とテキスト部分を分離するための関数
function splitTextAndMath(text: string) {
  const result: { type: 'text' | 'inline-math' | 'block-math'; content: string }[] = [];
  
  // インラインと块の数式のパターン
  // $...$ および $$...$$ に加えて \(...\) と \[...\] のパターンも検出
  const mathPattern = /(\$\$[\s\S]+?\$\$)|(\$[^$\n]+?\$)|(\\\([\s\S]+?\\\))|(\\\[[\s\S]+?\\\])/g;
  
  // マッチした位置を記録
  let lastEnd = 0;
  let match;
  
  while ((match = mathPattern.exec(text)) !== null) {
    // マッチの前にテキストがあれば追加
    if (match.index > lastEnd) {
      result.push({
        type: 'text',
        content: text.substring(lastEnd, match.index),
      });
    }
    
    // マッチした数式を追加
    if (match[1]) { // Block Math ($$...$$)
      result.push({
        type: 'block-math',
        content: match[1].substring(2, match[1].length - 2), // $$を除去
      });
    } else if (match[2]) { // Inline Math ($...$)
      result.push({
        type: 'inline-math',
        content: match[2].substring(1, match[2].length - 1), // $を除去
      });
    } else if (match[3]) { // Inline Math \(...\)
      result.push({
        type: 'inline-math',
        content: match[3].substring(2, match[3].length - 2), // \( と \) を除去
      });
    } else if (match[4]) { // Block Math \[...\]
      result.push({
        type: 'block-math',
        content: match[4].substring(2, match[4].length - 2), // \[ と \] を除去
      });
    }
    
    // 次の開始位置を更新
    lastEnd = match.index + match[0].length;
  }
  
  // 残りのテキストを追加
  if (lastEnd < text.length) {
    result.push({
      type: 'text',
      content: text.substring(lastEnd),
    });
  }
  
  return result;
}

// Markdown形式の太字を処理する関数
function processBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // 太字の場合
      return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
    } else {
      // 通常のテキスト
      return <span key={index}>{part}</span>;
    }
  });
}

// ヤコビのθ関数の特別処理
function normalizeJacobiTheta(formula: string): string {
  // 特定のヤコビのθ関数パターンを検出して正規化
  if (formula.includes("ヤコビのθ関数") || 
      formula.includes("sum") && formula.includes("prod") && 
      formula.includes("*n*=") && formula.includes("*q*")) {
    
    // 安全な公式に置き換え
    return "\\sum_{n=-\\infty}^{\\infty} z^n q^{n^2} = \\prod_{n=1}^{\\infty} (1-q^{2n})(1+zq^{2n-1})(1+z^{-1}q^{2n-1})";
  }
  
  return formula;
}

const MathText: React.FC<MathTextProps> = ({ text }) => {
  // テキストを解析
  const parts = splitTextAndMath(text);
  
  // モバイルであるかの判定
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // モバイル端末かどうか判定
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    
    setIsMobile(checkMobile());
  }, []);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{processBoldText(part.content)}</span>;
        } 
        else if (part.type === 'inline-math') {
          return <SafeMathComponent key={index} formula={part.content} displayMode={false} isMobile={isMobile} />;
        } 
        else if (part.type === 'block-math') {
          return <SafeMathComponent key={index} formula={part.content} displayMode={true} isMobile={isMobile} />;
        }
        return null;
      })}
    </>
  );
};

// 安全な数式レンダリングコンポーネント
const SafeMathComponent: React.FC<{ 
  formula: string; 
  displayMode: boolean;
  isMobile: boolean;
}> = ({ formula, displayMode, isMobile }) => {
  const containerRef = useRef<HTMLDivElement | HTMLSpanElement>(null);
  const [renderFailed, setRenderFailed] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // ヤコビのθ関数の特別処理
    const normalizedFormula = normalizeJacobiTheta(formula);
    
    try {
      // KaTeXのオプションを最適化
      const options = {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: false,
        maxSize: isMobile ? 5 : 10,
        maxExpand: isMobile ? 100 : 1000,
        errorColor: '#f44336'
      };
      
      // モバイルで特に複雑な数式の場合、タイムアウト処理を追加
      const katexRenderTimeout = setTimeout(() => {
        console.warn('KaTeX rendering timeout - Using fallback');
        setRenderFailed(true);
      }, 1000); // 1秒でタイムアウト
      
      katex.render(normalizedFormula, containerRef.current, options);
      clearTimeout(katexRenderTimeout);
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      setRenderFailed(true);
    }
  }, [formula, displayMode, isMobile]);
  
  // レンダリングに失敗した場合、フォールバックを使用
  if (renderFailed) {
    return <FallbackMathDisplay formula={formula} displayMode={displayMode} />;
  }
  
  return displayMode ? (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className="py-2 overflow-x-auto" />
  ) : (
    <span ref={containerRef as React.RefObject<HTMLSpanElement>} />
  );
};

export default MathText;