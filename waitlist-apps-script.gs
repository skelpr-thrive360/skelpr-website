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
 *    edit manually: Pending / Reached out / Success / Declined (new rows start
 *    as "Pending").
 *  - Styles the Sheet: bold frozen header, banded data rows, formatted
 *    timestamps, and color-coded Progress values. The Progress dropdown is
 *    attached ONLY to rows that have a recorded email — empty rows stay clean.
 *  - Migrates an old "Source" header to "Progress" and fills legacy blanks.
 *  - Silently ignores submissions that filled the hidden honeypot ("trap").
 *  - Safe for concurrent submissions (script lock) and repeat clicks (dedupe).
 *  - Never exposes the sheet contents: responses contain only { ok, ... } flags.
 */

var SHEET_NAME = 'Waitlist'
var PROGRESS_DEFAULT = 'Pending'
var PROGRESS_OPTIONS = ['Pending', 'Reached out', 'Success', 'Declined']
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
var STYLE_FLAG = 'waitlist-styled-v4'
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
      ensureHeader_(sheet)
      var match = findRow_(sheet, email)

      if (action === 'withdraw') {
        if (match) sheet.deleteRow(match)
        safe_(function () { refreshDataStyling_(sheet) })
        return json_({ ok: true, removed: Boolean(match) })
      }

      if (match) return json_({ ok: true, duplicate: true })
      sheet.appendRow([new Date(), email, PROGRESS_DEFAULT])
      safe_(function () { refreshDataStyling_(sheet) })
      return json_({ ok: true, duplicate: false })
    } finally {
      lock.releaseLock()
    }
  } catch (err) {
    return json_({ ok: false, error: 'Server error. Please try again.' })
  }
}

// Handy sanity check: opening the /exec URL in a browser should print
// {"ok":true,"service":"waitlist","schema":"progress-v4"}.
// If the schema field is missing (or says v2/v3), the live deployment is OLD code.
function doGet() {
  return json_({ ok: true, service: 'waitlist', schema: 'progress-v4' })
}

// Creates the header row on a fresh sheet, migrates a legacy "Source" header,
// and applies the one-time sheet styling.
function ensureHeader_(sheet) {
  var lastRow = sheet.getLastRow()
  if (lastRow === 0) {
    sheet.appendRow(['Timestamp', 'Email', 'Progress'])
  } else if (String(sheet.getRange(1, 3).getValue()).trim().toLowerCase() === 'source') {
    sheet.getRange(1, 3).setValue('Progress')
    // Legacy recorded rows: give blanks a starting progress value.
    if (lastRow >= 2) {
      safe_(function () {
        var progressCol = sheet.getRange(2, 3, lastRow - 1, 1)
        var values = progressCol.getValues()
        var changed = false
        for (var i = 0; i < values.length; i++) {
          if (!String(values[i][0]).trim()) { values[i][0] = PROGRESS_DEFAULT; changed = true }
        }
        if (changed) progressCol.setValues(values)
      })
    }
  }
  safe_(function () { styleOnce_(sheet) })
}

// Per-request data styling. Validation + formats attach ONLY to rows that have
// a recorded email (rows 2..lastRow) — empty rows below stay clean.
function refreshDataStyling_(sheet) {
  // Wipe validation/formatting left by older versions on the whole column
  // (the old script painted dropdowns onto empty rows down to 1000).
  sheet.getRange(2, 3, sheet.getMaxRows() - 1, 1).clearDataValidations()
  var lastRow = sheet.getLastRow()
  if (lastRow < 2) return
  var dataRows = lastRow - 1
  sheet.getRange(2, 3, dataRows, 1).setDataValidation(progressValidation_())
  sheet.getRange(2, 1, dataRows, 1).setNumberFormat('yyyy-mm-dd hh:mm')
  var bandings = sheet.getBandings()
  for (var i = 0; i < bandings.length; i++) bandings[i].remove()
  sheet.getRange(2, 1, dataRows, 3).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false)
}

// One-time look-and-feel (guarded by a document property so it runs once).
function styleOnce_(sheet) {
  var props = PropertiesService.getDocumentProperties()
  if (props.getProperty(STYLE_FLAG)) return

  var header = sheet.getRange(1, 1, 1, 3)
  header.setFontWeight('bold')
  header.setFontColor('#ffffff')
  header.setBackground('#0f4c5c')
  header.setVerticalAlignment('middle')
  sheet.setRowHeight(1, 34)
  sheet.setFrozenRows(1)
  sheet.setColumnWidth(1, 165)
  sheet.setColumnWidth(2, 290)
  sheet.setColumnWidth(3, 145)

  // Color-coded Progress chips. Conditional formatting only paints cells that
  // actually hold a value, so blank rows are never colored.
  var progressRange = sheet.getRange(2, 3, 999, 1)
  var styles = [
    ['Pending', '#fff4d5', '#8a6100'],
    ['Reached out', '#e0ecff', '#1d4fa1'],
    ['Success', '#e1f4e0', '#1e7b34'],
    ['Declined', '#fde4e1', '#b3402f'],
  ]
  var rules = []
  for (var i = 0; i < styles.length; i++) {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(styles[i][0])
      .setBackground(styles[i][1])
      .setFontColor(styles[i][2])
      .setBold(true)
      .setRanges([progressRange])
      .build())
  }
  sheet.setConditionalFormatRules(rules)

  props.setProperty(STYLE_FLAG, new Date().toISOString())
}

function progressValidation_() {
  if (!PROGRESS_VALIDATION_) {
    PROGRESS_VALIDATION_ = SpreadsheetApp.newDataValidation()
      .requireValueInList(PROGRESS_OPTIONS, true)
      .setAllowInvalid(true)
      .setHelpText('Pick: Pending, Reached out, Success or Declined.')
      .build()
  }
  return PROGRESS_VALIDATION_
}

// Cosmetic work must never break a signup: a styling failure is logged and
// swallowed so the submission itself still succeeds.
function safe_(fn) {
  try {
    fn()
  } catch (stylingErr) {
    console.error('waitlist styling failed (submission unaffected): ' + stylingErr)
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
