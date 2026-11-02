// Backend for the portfolio comment mode. Stores comments in the first sheet of the spreadsheet below.
// Deploy > Web app: Execute as "Me", Who has access "Anyone".
// Each comment gets a secret token returned only to the browser that wrote it; edit/delete need that token.
var SHEET_ID = '12wkrh63qby5h6i3ttDllZedD7znepNHLPSP28VYains';
var HEAD = ['id', 'thời gian', 'người góp ý', 'góp ý', 'vị trí', 'anchor (đừng sửa)', 'trạng thái (gõ: xong)', 'mã sửa (đừng sửa)'];

function sheet_() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(HEAD);
  if (sh.getRange(1, HEAD.length).getValue() !== HEAD[HEAD.length - 1]) {
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold'); sh.setFrozenRows(1);
  }
  return sh;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function findRow_(sh, id) {
  var n = sh.getLastRow(); if (n < 2) return 0;
  var ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

function doGet() {
  var sh = sheet_(), n = sh.getLastRow();
  if (n < 2) return out_({ items: [] });
  var rows = sh.getRange(2, 1, n - 1, HEAD.length).getValues();
  return out_({ items: rows.filter(function (r) { return r[0] && r[5]; }).map(function (r) {
    return { id: String(r[0]), date: r[1], name: r[2], text: r[3], where: r[4], anchor: r[5],
             done: /^(xong|done|x)$/i.test(String(r[6]).trim()) };
  }) });
}

function doPost(e) {
  var d = JSON.parse((e.postData && e.postData.contents) || '{}');
  if (d.hp) return out_({ ok: true });                       // honeypot: bots fill the hidden field
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = sheet_(), action = d.action || 'create';
    if (action === 'create') {
      var text = String(d.text || '').trim().slice(0, 3000);
      if (!text) return out_({ ok: false, error: 'empty' });
      var id = Utilities.getUuid().slice(0, 8), token = Utilities.getUuid();
      sh.appendRow([id, new Date(), String(d.name || 'Mentor').slice(0, 60), text,
                    String(d.where || '').slice(0, 200), JSON.stringify(d.anchor || {}).slice(0, 2000), '', token]);
      return out_({ ok: true, id: id, token: token });
    }
    var row = findRow_(sh, d.id);
    if (!row) return out_({ ok: false, error: 'notfound' });
    if (!d.token || sh.getRange(row, 8).getValue() !== d.token) return out_({ ok: false, error: 'forbidden' });
    if (action === 'edit') {
      var t = String(d.text || '').trim().slice(0, 3000);
      if (!t) return out_({ ok: false, error: 'empty' });
      sh.getRange(row, 4).setValue(t);
      return out_({ ok: true });
    }
    if (action === 'delete') { sh.deleteRow(row); return out_({ ok: true }); }
    return out_({ ok: false, error: 'action' });
  } finally { lock.releaseLock(); }
}
