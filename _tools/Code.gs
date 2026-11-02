// Backend for the portfolio comment mode. Stores comments in the first sheet of this spreadsheet.
// Deploy > Web app: Execute as "Me", Who has access "Anyone".
var HEAD = ['id', 'thời gian', 'người góp ý', 'góp ý', 'vị trí', 'anchor (đừng sửa)', 'trạng thái (gõ: xong)'];

function sheet_() {
  var sh = SpreadsheetApp.openById('12wkrh63qby5h6i3ttDllZedD7znepNHLPSP28VYains').getSheets()[0];
  if (sh.getLastRow() === 0) { sh.appendRow(HEAD); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold'); }
  return sh;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet() {
  var sh = sheet_(), n = sh.getLastRow();
  if (n < 2) return out_({ items: [] });
  var rows = sh.getRange(2, 1, n - 1, HEAD.length).getValues();
  return out_({ items: rows.filter(function (r) { return r[0] && r[5]; }).map(function (r) {
    return { id: r[0], date: r[1], name: r[2], text: r[3], where: r[4], anchor: r[5], done: /^(xong|done|x)$/i.test(String(r[6]).trim()) };
  }) });
}

function doPost(e) {
  var d = JSON.parse(e.postData.contents || '{}');
  if (d.hp) return out_({ ok: true });                       // honeypot: bots fill hidden field
  var text = String(d.text || '').trim().slice(0, 3000);
  if (!text) return out_({ ok: false, error: 'empty' });
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = sheet_(), id = sh.getLastRow();                  // header is row 1, so ids start at 1
    sh.appendRow([id, new Date(), String(d.name || 'Mentor').slice(0, 60), text,
                  String(d.where || '').slice(0, 200), JSON.stringify(d.anchor || {}).slice(0, 2000), '']);
    return out_({ ok: true, id: id });
  } finally { lock.releaseLock(); }
}
