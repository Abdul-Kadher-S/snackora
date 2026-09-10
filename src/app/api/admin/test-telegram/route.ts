import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!botToken || !chatId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Environment Variables',
          details: {
            TELEGRAM_BOT_TOKEN: botToken ? 'Configured ✅' : 'MISSING ❌',
            TELEGRAM_CHAT_ID: chatId ? `Configured (${chatId}) ✅` : 'MISSING ❌',
          },
          hint: 'Please add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel Settings -> Environment Variables and Redeploy.',
        },
        { status: 400 }
      );
    }

    const testMessage = `
🔔 <b>SNACKORA TELEGRAM TEST ALERT</b> 🔔

✅ Connection Successful!
🕒 Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
📱 Bot Token: ${botToken.slice(0, 6)}...${botToken.slice(-4)}
💬 Chat ID: <code>${chatId}</code>

Your Snackora delivery notifications are ready to receive live orders!
`.trim();

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          telegramError: result,
          hint: result.description || 'Telegram API rejected the request. Verify bot is an admin in group.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent to Telegram successfully!',
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to dispatch test notification' },
      { status: 500 }
    );
  }
}
