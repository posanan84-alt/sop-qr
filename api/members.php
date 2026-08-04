<?php
// members.php — 会員一覧 API（QRアプリ向け）
// GET https://sop-dance.com/member/api/members.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

define('DB_HOST',    'mysql4b.xserver.jp');
define('DB_NAME',    'takeni_sopevent');
define('DB_USER',    'takeni_ysakai');
define('DB_PASS',    ';lzpJst?9A]v');
define('DB_CHARSET', 'utf8mb4');

// name_sei / name_mei（本来ふりがな）に漢字が誤入力されている行は、
// name_furigana から姓・名を補完する（スプレッドシートの入力ミス対策）
function fixKanaFallback($sei, $mei, $furigana) {
    if (!preg_match('/[\x{4E00}-\x{9FFF}]/u', $sei . $mei)) {
        return [$sei, $mei]; // 漢字混入なし → そのまま
    }
    $furi = trim(preg_replace('/[\x{3000}\s]+/u', ' ', (string)$furigana));
    $parts = explode(' ', $furi, 2);
    if (count($parts) === 2 && $parts[0] !== '' && $parts[1] !== '') {
        return [$parts[0], $parts[1]];
    }
    return [$sei, $mei]; // furiganaからも分割できなければ元の値を維持
}

try {
    $pdo = new PDO(
        'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset='.DB_CHARSET,
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->query(
        "SELECT member_id, name_kanji, name_furigana, name_sei, name_mei,
                status_1, status_2, location, member_id_sub, payment
         FROM members
         ORDER BY member_id"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // QRアプリが期待する形式 { "会員番号": { lastName, firstName, ... } } に変換
    $members = [];
    foreach ($rows as $r) {
        [$sei, $mei] = fixKanaFallback($r['name_sei'], $r['name_mei'], $r['name_furigana']);
        $members[$r['member_id']] = [
            'lastName'      => $sei,
            'firstName'     => $mei,
            'nameKanji'     => $r['name_kanji'],
            'nameFurigana'  => $r['name_furigana'],
            'status1'       => $r['status_1'],
            'status2'       => $r['status_2'],
            'location'      => $r['location'],
            'memberIdSub'   => $r['member_id_sub'],
            'payment'       => $r['payment'],
        ];
    }

    echo json_encode(['success' => true, 'members' => $members, 'count' => count($members)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
