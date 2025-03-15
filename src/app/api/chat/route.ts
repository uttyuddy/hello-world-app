// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ユーザの質問を取得: user_message または message のどちらかを使用
    const userMessage =
      typeof body.user_message === 'string' && body.user_message.trim() !== ""
        ? body.user_message.trim()
        : typeof body.message === 'string' && body.message.trim() !== ""
        ? body.message.trim()
        : "";

    // 質問が空の場合の処理（必要に応じてエラーを返すなど）
    if (!userMessage) {
      return NextResponse.json(
        { error: '質問が空です。質問を入力してください。' },
        { status: 400 }
      );
    }

    // 直前の o1-mini 出力 (ai_message) を取得し、空の場合は初期値を設定
    const aiMessage =
      typeof body.ai_message === 'string' && body.ai_message.trim() !== ""
        ? body.ai_message.trim()
        : "誰か学びを大事に思ってる生徒はこないかな～";

    // 指定の形式でプロンプトを生成
    const prompt = `o1-miniは先程「${aiMessage}」といいましたがその上で質問です。「${userMessage}」
回答に数式が必要な場合は、$...$（インライン数式）や$$...$$（ブロック数式）の形式で書いてください。KaTeXに対応する形で出力してください。`;

    // プロンプトを1つの user ロールのメッセージとして設定
    const messages = [{ role: "user", content: prompt }];

    // OpenAI APIにリクエスト送信（max_tokensパラメーターは削除）
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'o1-mini', // 使用するモデル
        messages
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: '外部APIエラー', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    const botMessage = data.choices[0]?.message?.content || '応答がありませんでした';
    return NextResponse.json({ message: botMessage });
  } catch (error: unknown) {
    // Error 型以外の例外の場合は再 throw する
    if (!(error instanceof Error)) {
      throw error;
    }
    console.error('APIエラー:', error.message);
    return NextResponse.json(
      { error: 'サーバーエラー', message: error.message },
      { status: 500 }
    );
  }
}
