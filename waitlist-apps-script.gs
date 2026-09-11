/**
 * LoCoDex waitlist backend — paste this into a Google Apps Script bound to your
 * Google Sheet (Extensions → Apps Script), then deploy as a Web App.
 * Full checklist in website/README.md ("Waitlist setup").
 *
 * What it does:
 *  - Receives POST { email, action, trap } from the website forms.
 *    action="join" (default): appends one row per unique email.
 *    action="withdraw": deletes the row for that email (no-op if absent).
 *  - Sheet columns: Timestamp | Email | Progress. Progress is meant for YOU to
 *    edit manually: a dropdown with Pending / Reached out / Success / Declined
 *    (new rows start as "Pending").
 *  - Migrates an old "Source" header to "Progress" automatically.
 *  - Silently ignores submissions that filled the hidden honeypot ("trap").
 *  - Safe for concurrent submissions (script lock) and repeat clicks (dedupe).
 *  - Never exposes the sheet contents: responses contain only { ok, ... } flags.
 */

var SHEET_NAME = 'Waitlist'
var PROGRESS_DEFAULT = 'Pending'
var PROGRESS_OPTIONS = ['Pending', 'Reached out', 'Success', 'Declined']
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
var PROGRESS_VALIDATION_ = null

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents)
    var email = String(data.email || '').trim().toLowerCase()
    var action = String(data.action || 'join').trim().toLowerCase()
    var trap = String(data.trap || '').trim()

    // Honeypot filled → almost certainly a bot. Answer ok so it learns nothing.
    if (trap || !EMAIL_RE.test(email)) {
      return json_({ ok: true })
    }

    var lock = LockService.getScriptLock()
    lock.waitLock(10000)
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet()
      var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME)
      ensureSchema_(sheet)
      var match = findRow_(sheet, email)

      if (action === 'withdraw') {
        if (match) sheet.deleteRow(match)
        return json_({ ok: true, removed: Boolean(match) })
      }

      if (match) return json_({ ok: true, duplicate: true })
      sheet.appendRow([new Date(), email, PROGRESS_DEFAULT])
      return json_({ ok: true, duplicate: false })
    } finally {
      lock.releaseLock()
    }
  } catch (err) {
    return json_({ ok: false, error: 'Server error. Please try again.' })
  }
}

// Handy sanity check: opening the /exec URL in a browser should print
// {"ok":true,"service":"waitlist","schema":"progress-v2"}.
// If the schema field is missing, the live deployment is still running OLD code.
function doGet() {
  return json_({ ok: true, service: 'waitlist', schema: 'progress-v2' })
}

// Creates the header row on a fresh sheet, renames a legacy "Source" header,
// and attaches the Progress dropdown to rows 2..1000 (once).
function ensureSchema_(sheet) {
  var lastRow = sheet.getLastRow()
  if (lastRow === 0) {
    sheet.appendRow(['Timestamp', 'Email', 'Progress'])
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold')
  } else if (String(sheet.getRange(1, 3).getValue()).trim().toLowerCase() === 'source') {
    sheet.getRange(1, 3).setValue('Progress')
  }
  if (!PROGRESS_VALIDATION_) {
    PROGRESS_VALIDATION_ = SpreadsheetApp.newDataValidation()
      .requireValueInList(PROGRESS_OPTIONS, true)
      .setAllowInvalid(true)
      .setHelpText('Pick: Pending, Reached out, Success or Declined.')
      .build()
  }
  if (!sheet.getRange(2, 3).getDataValidation()) {
    sheet.getRange(2, 3, 999, 1).setDataValidation(PROGRESS_VALIDATION_)
  }
}

// Returns the 1-based row number for the email, or 0 if not present.
function findRow_(sheet, email) {
  var lastRow = sheet.getLastRow()
  if (lastRow < 2) return 0
  var emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues()
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === email) return i + 2
  }
  return 0
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
