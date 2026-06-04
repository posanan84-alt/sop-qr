// ================================================================
// syncMembersToMySQL()
// スプレッドシートの会員データを XServer MySQL に同期する
// 使い方：
//   1. GASエディタにこのコードを追加
//   2. syncMembersToMySQL() を実行、または
//      スプレッドシートにボタンを作成して紐付け
// ================================================================

var SYNC_URL    = 'https://sop-dance.com/member/api/sync.php';
var SYNC_SECRET = 'SOP_MEMBER_SYNC_2026_xK9mPq';

// 会員データが入っているシート名（実際のシート名に合わせてください）
var MEMBER_SHEET_NAME = 'members'; // ← 要確認

function syncMembersToMySQL() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MEMBER_SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert('シート「' + MEMBER_SHEET_NAME + '」が見つかりません。シート名を確認してください。');
    return;
  }

  var data    = sheet.getDataRange().getValues();
  var headers = data[0]; // 1行目がヘッダー

  // ヘッダーのインデックスを取得
  var idx = {
    member_id:     headers.indexOf('member_ID'),       // 1つ目
    name_kanji:    headers.indexOf('name_kanji'),
    name_furigana: headers.indexOf('name_furigana'),
    name_sei:      headers.indexOf('name_sei'),
    name_mei:      headers.indexOf('name_mei'),
    status_1:      headers.indexOf('status_1'),
    status_2:      headers.indexOf('status_2'),
    location:      headers.indexOf('location'),
    member_id_sub: headers.lastIndexOf('member_ID'),   // 2つ目
    payment:       headers.indexOf('payment'),
  };

  // データ行を変換
  var members = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var memberId = String(row[idx.member_id] || '').trim();
    if (!memberId) continue; // 会員番号が空の行はスキップ

    members.push({
      member_id:     memberId,
      name_kanji:    String(row[idx.name_kanji]    || '').trim(),
      name_furigana: String(row[idx.name_furigana] || '').trim(),
      name_sei:      String(row[idx.name_sei]      || '').trim(),
      name_mei:      String(row[idx.name_mei]      || '').trim(),
      status_1:      String(row[idx.status_1]      || '').trim(),
      status_2:      String(row[idx.status_2]      || '').trim(),
      location:      String(row[idx.location]      || '').trim(),
      member_id_sub: String(row[idx.member_id_sub] || '').trim(),
      payment:       String(row[idx.payment]       || '').trim(),
    });
  }

  // PHP API に送信
  var payload = JSON.stringify({ secret: SYNC_SECRET, members: members });
  var options = {
    method:      'post',
    contentType: 'application/json',
    payload:     payload,
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(SYNC_URL, options);
    var result   = JSON.parse(response.getContentText());

    if (result.success) {
      SpreadsheetApp.getUi().alert('✅ 同期完了：' + result.synced + '件をMySQLに書き込みました');
    } else {
      SpreadsheetApp.getUi().alert('❌ エラー：' + result.message);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ 通信エラー：' + e.message);
  }
}
