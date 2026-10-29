<?php
// Приём заявок с сайта: отправляет в Telegram и на почту.
// Настройки лежат в config.php (скопируйте config.example.php -> config.php).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out($code, $arr) { http_response_code($code); echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false, 'error' => 'method']);

$cfgFile = __DIR__ . '/config.php';
if (!file_exists($cfgFile)) out(500, ['ok' => false, 'error' => 'config']);
$cfg = require $cfgFile;

$raw = file_get_contents('php://input');
$in = json_decode($raw, true);
if (!is_array($in)) out(400, ['ok' => false, 'error' => 'json']);

// защита от ботов: скрытое поле и согласие
if (!empty($in['website'])) out(200, ['ok' => true]);
if (empty($in['consent'])) out(400, ['ok' => false, 'error' => 'consent']);

$clean = function ($s, $max) {
    $s = trim((string)$s);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s);
    return mb_substr($s, 0, $max);
};
$name = $clean($in['name'] ?? '', 80);
$phone = $clean($in['phone'] ?? '', 30);
$comment = $clean($in['comment'] ?? '', 1500);
$page = $clean($in['page'] ?? '', 300);
$kind = ($in['kind'] ?? '') === 'cart' ? 'cart' : 'message';

if ($name === '' || strlen(preg_replace('/\D/', '', $phone)) < 10) out(400, ['ok' => false, 'error' => 'fields']);

// простая защита от потока заявок: 6 штук за 10 минут с одного IP
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$rl = sys_get_temp_dir() . '/ironshop_rl_' . md5($ip);
$now = time(); $hits = [];
if (file_exists($rl)) $hits = array_filter(array_map('intval', explode(',', (string)file_get_contents($rl))), function ($t) use ($now) { return $now - $t < 600; });
if (count($hits) >= 6) out(429, ['ok' => false, 'error' => 'rate']);
$hits[] = $now; @file_put_contents($rl, implode(',', $hits));

// состав корзины
$lines = []; $total = 0;
if ($kind === 'cart' && !empty($in['items']) && is_array($in['items'])) {
    foreach (array_slice($in['items'], 0, 60) as $it) {
        $t = $clean($it['title'] ?? '', 160);
        $qty = max(1, min(99, (int)($it['qty'] ?? 1)));
        $price = isset($it['price']) && is_numeric($it['price']) ? (float)$it['price'] : null;
        $url = $clean($it['url'] ?? '', 300);
        $sum = $price !== null ? $price * $qty : 0; $total += $sum;
        $lines[] = ['t' => $t, 'qty' => $qty, 'price' => $price, 'url' => $url];
    }
}

$fmt = function ($n) { return number_format($n, 0, ',', ' ') . ' ₽'; };
$site = rtrim($cfg['site'] ?? '', '/');

// ---- текст для Telegram (HTML) и для почты (plain)
$h = function ($s) { return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8'); };
$tg = ($kind === 'cart' ? '🛒 <b>Новая заявка из корзины</b>' : '✉️ <b>Сообщение с сайта</b>') . "\n\n";
$tg .= '👤 ' . $h($name) . "\n📞 " . $h($phone) . "\n";
$plain = ($kind === 'cart' ? "Новая заявка из корзины\n\n" : "Сообщение с сайта\n\n") . "Имя: $name\nТелефон: $phone\n";
if ($lines) {
    $tg .= "\n<b>Состав:</b>\n"; $plain .= "\nСостав:\n";
    foreach ($lines as $i => $l) {
        $p = $l['price'] !== null ? $fmt($l['price']) : 'цена по запросу';
        $tg .= ($i + 1) . '. ' . $h($l['t']) . ' — ' . $l['qty'] . ' шт., ' . $h($p) . "\n";
        $plain .= ($i + 1) . '. ' . $l['t'] . ' — ' . $l['qty'] . ' шт., ' . $p . ($l['url'] ? ' ' . $site . $l['url'] : '') . "\n";
    }
    if ($total > 0) { $tg .= "\n💰 <b>Итого: " . $h($fmt($total)) . "</b>\n"; $plain .= "\nИтого: " . $fmt($total) . "\n"; }
}
if ($comment !== '') { $tg .= "\n💬 " . $h($comment) . "\n"; $plain .= "\nКомментарий: $comment\n"; }
if ($page !== '') { $tg .= "\n🔗 " . $h($page); $plain .= "\nСтраница: $page\n"; }

$okTg = false; $okMail = false;

// ---- Telegram
if (!empty($cfg['tg_token']) && !empty($cfg['tg_chat'])) {
    $url = 'https://api.telegram.org/bot' . $cfg['tg_token'] . '/sendMessage';
    $payload = http_build_query(['chat_id' => $cfg['tg_chat'], 'text' => $tg, 'parse_mode' => 'HTML', 'disable_web_page_preview' => 'true']);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 5]);
        if (!empty($cfg['tg_proxy'])) curl_setopt($ch, CURLOPT_PROXY, $cfg['tg_proxy']);
        $res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
        $okTg = ($code === 200);
    } else {
        $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\n", 'content' => $payload, 'timeout' => 8]]);
        $res = @file_get_contents($url, false, $ctx);
        $okTg = $res !== false;
    }
}

// ---- Почта
if (!empty($cfg['email_to'])) {
    $subject = ($kind === 'cart' ? 'Заявка из корзины: ' : 'Сообщение с сайта: ') . $name;
    $from = $cfg['email_from'] ?? ('no-reply@' . preg_replace('#^https?://#', '', $site));
    $headers = "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nFrom: iRon Shop <$from>\r\nReply-To: $from\r\n";
    $okMail = @mail($cfg['email_to'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $plain, $headers);
}

if ($okTg || $okMail) out(200, ['ok' => true, 'tg' => $okTg, 'mail' => $okMail]);
out(502, ['ok' => false, 'error' => 'delivery']);
