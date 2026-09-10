/**
 * Telegram Order Notification Service
 * Dispatches real-time order alerts to admin / delivery staff channel or group.
 * Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID securely from backend environment.
 */

interface OrderItemInfo {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  phone: string;
  hostel: string;
  roomNumber: string;
  deliveryNote?: string | null;
  items: OrderItemInfo[];
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  total: number;
  paymentMethod?: string;
  freeDeliveryApplied?: boolean;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramOrderNotification(order: OrderNotificationData): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('⚠️ Telegram notifications skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.');
    return false;
  }

  try {
    const istTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: '2-digit',
      month: 'short',
    });

    const itemsText = order.items
      .map(
        (item, idx) =>
          `  ${idx + 1}. <b>${escapeHtml(item.productName)}</b> × ${item.quantity} — ₹${item.subtotal}`
      )
      .join('\n');

    let feeLine = `🚚 <b>Delivery Fee:</b> ₹${order.deliveryFee}`;
    if (order.deliveryFee === 0 || order.freeDeliveryApplied) {
      feeLine = `🚚 <b>Delivery:</b> FREE 🎉`;
    }

    let discountLine = '';
    if (order.couponDiscount && order.couponDiscount > 0) {
      discountLine = `\n🎟️ <b>Coupon Discount:</b> -₹${order.couponDiscount}`;
    }

    let noteLine = '';
    if (order.deliveryNote && order.deliveryNote.trim()) {
      noteLine = `\n📝 <b>Delivery Note:</b> <i>${escapeHtml(order.deliveryNote.trim())}</i>`;
    }

    const message = `
🚨 <b>NEW ORDER #${escapeHtml(order.orderNumber)}</b> 🚨

🕒 <b>Time:</b> ${istTime}

👤 <b>Customer:</b> ${escapeHtml(order.customerName)}
📞 <b>Phone:</b> <a href="tel:+91${escapeHtml(order.phone)}">+91 ${escapeHtml(order.phone)}</a>
🏢 <b>Block:</b> ${escapeHtml(order.hostel)}
🚪 <b>Room:</b> ${escapeHtml(order.roomNumber)}${noteLine}

🛒 <b>Order Items:</b>
${itemsText}

💰 <b>Subtotal:</b> ₹${order.subtotal}
${feeLine}${discountLine}
━━━━━━━━━━━━━━━━━━
💵 <b>TOTAL PAYABLE: ₹${order.total}</b>
💳 <b>Payment:</b> Cash on Delivery (COD)
`.trim();

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Failed to send Telegram message:', response.status, errBody);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error dispatching Telegram order notification:', error);
    return false;
  }
}
