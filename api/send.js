// Vercel serverless function: заявки с сайта в Telegram.
// Переменные окружения в Vercel: TG_TOKEN (токен бота), TG_CHAT (ваш chat id)
const hits = new Map();
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('{"ok":false}'); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  if (b.website) { return res.end('{"ok":true}'); }              // ловушка для ботов
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (list.length >= 5) { res.statusCode = 429; return res.end('{"ok":false}'); }
  list.push(now); hits.set(ip, list);
  const name = String(b.name || '').trim().slice(0, 80), phone = String(b.phone || '').trim().slice(0, 40);
  if (!name || phone.replace(/\D/g, '').length < 10 || !b.consent) { res.statusCode = 400; return res.end('{"ok":false}'); }
  const token = process.env.TG_TOKEN, chat = process.env.TG_CHAT;
  if (!token || !chat) { res.statusCode = 500; return res.end('{"ok":false}'); }
  const lines = [b.kind === 'cart' ? '🛒 Новый заказ iRon Shop' : '✉️ Сообщение с сайта iRon Shop', 'Имя: ' + name, 'Телефон: ' + phone];
  if (Array.isArray(b.items) && b.items.length) {
    lines.push('', 'Состав заказа:');
    let sum = 0;
    b.items.slice(0, 50).forEach((i, n) => {
      const q = Math.max(1, parseInt(i.qty, 10) || 1), p = Number(i.price) || 0; sum += p * q;
      lines.push((n + 1) + '. ' + String(i.title || '').slice(0, 120) + ' × ' + q + (p ? ' — ' + p * q + ' ₽' : ''));
      if (i.url) lines.push('   https://ironshop.moscow' + String(i.url).slice(0, 200));
    });
    if (sum) lines.push('Итого: ' + sum + ' ₽');
  }
  if (b.comment) lines.push('', 'Комментарий: ' + String(b.comment).slice(0, 1000));
  if (b.page) lines.push('', 'Страница: ' + String(b.page).slice(0, 300));
  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: lines.join('\n'), disable_web_page_preview: true })
    });
    const j = await r.json();
    if (!j.ok) { res.statusCode = 502; return res.end('{"ok":false}'); }
    return res.end('{"ok":true}');
  } catch (e) { res.statusCode = 502; return res.end('{"ok":false}'); }
};
