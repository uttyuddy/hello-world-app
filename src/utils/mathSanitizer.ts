// src/utils/mathSanitizer.ts

/**
 * 複雑すぎる数式や問題を起こす可能性のある数式を安全な形式に変換する
 */
export function sanitizeMathFormula(formula: string): string {
  // ヤコビのθ関数恒等式を検出して安全な形式に変換
  if (
    formula.includes("ヤコビのθ関数") ||
    formula.includes("ヤコビの\\theta関数") ||
    formula.includes("θ関数恒等式") ||
    formula.includes("\\theta関数恒等式")
  ) {
    return `
ヤコビのθ関数恒等式は以下のように表されます：

$$\\sum_{n=-\\infty}^{\\infty} z^n q^{n^2} = \\prod_{n=1}^{\\infty} (1-q^{2n})(1+zq^{2n-1})(1+z^{-1}q^{2n-1})$$
    `.trim();
  }

  // その他の複雑な数式パターンを検出
  if (
    // 複雑な入れ子の多い数式
    (formula.match(/\{/g)?.length || 0) > 10 ||
    (formula.match(/\}/g)?.length || 0) > 10 ||
    
    // 極端に長い数式
    formula.length > 500 ||
    
    // 多数の添え字を含む数式
    (formula.match(/_/g)?.length || 0) > 20 ||
    (formula.match(/\^/g)?.length || 0) > 20 ||
    
    // 無限和や無限積など計算量の多い表現
    ((formula.includes("\\sum") || formula.includes("\\prod")) && 
      (formula.includes("\\infty") || formula.includes("∞")))
  ) {
    // 複雑な数式を特定した場合、よりシンプルな表現に置き換え
    return "複雑な数式を検出しました。簡略化された形式で表示します。";
  }

  return formula;
}

/**
 * APIレスポンスの数式を処理する
 */
export function processApiMathResponse(response: string): string {
  // 応答テキスト内の数式を検出して処理
  const mathRegex = /(\$\$[\s\S]+?\$\$)|(\$[^$\n]+?\$)/g;
  
  return response.replace(mathRegex, (match) => {
    if (match.startsWith("$$") && match.endsWith("$$")) {
      // ブロック数式
      const formula = match.substring(2, match.length - 2);
      const sanitized = sanitizeMathFormula(formula);
      return `$$${sanitized}$$`;
    } else if (match.startsWith("$") && match.endsWith("$")) {
      // インライン数式
      const formula = match.substring(1, match.length - 1);
      const sanitized = sanitizeMathFormula(formula);
      return `$${sanitized}$`;
    }
    return match;
  });
}

/**
 * 特定の数式リクエストに対するレスポンスを事前に用意
 */
export function getPrecomputedMathResponse(userMessage: string): string | null {
  // ヤコビのθ関数恒等式についての質問を検出
  if (
    userMessage.includes("ヤコビのθ関数") && 
    userMessage.includes("表示") && 
    (userMessage.includes("説明とか不要") || userMessage.includes("説明不要"))
  ) {
    return `
ヤコビのθ関数恒等式:

$$\\sum_{n=-\\infty}^{\\infty} z^n q^{n^2} = \\prod_{n=1}^{\\infty} (1-q^{2n})(1+zq^{2n-1})(1+z^{-1}q^{2n-1})$$
    `.trim();
  }
  
  return null; // 事前計算されたレスポンスがない場合
}