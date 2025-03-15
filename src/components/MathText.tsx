import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

const MathText: React.FC<MathTextProps> = ({ text }) => {
  // テキストを解析
  const parts = splitTextAndMath(text);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{processBoldText(part.content)}</span>;
        } 
        else if (part.type === 'inline-math') {
          return <InlineMathComponent key={index} formula={part.content} />;
        } 
        else if (part.type === 'block-math') {
          return <BlockMathComponent key={index} formula={part.content} />;
        }
        return null;
      })}
    </>
  );
};

// インライン数式コンポーネント
const InlineMathComponent: React.FC<{ formula: string }> = ({ formula }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: false,
          throwOnError: false
        });
      } catch (error) {
        console.error('KaTeX inline rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = '$' + formula + '$';
          containerRef.current.classList.add('text-red-500');
        }
      }
    }
  }, [formula]);
  
  return <span ref={containerRef} />;
};

// ブロック数式コンポーネント
const BlockMathComponent: React.FC<{ formula: string }> = ({ formula }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: true,
          throwOnError: false
        });
      } catch (error) {
        console.error('KaTeX block rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = '$$' + formula + '$$';
          containerRef.current.classList.add('text-red-500');
        }
      }
    }
  }, [formula]);
  
  return <div ref={containerRef} className="py-2" />;
};

export default MathText;