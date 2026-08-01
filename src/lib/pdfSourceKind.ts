/**
 * Source-kind predicates for the PDF reader.
 *
 * Kept in a standalone module (instead of inside FastPdfReader) so they can be
 * unit-tested without pulling pdf.js/canvas into the test environment.
 */

/**
 * Smart content-crop is a Google Sheets-only workaround. Sheets exports arrive
 * either as a direct docs.google.com/spreadsheets link or wrapped inside the
 * pdf-proxy `url=` query param. Everything else must render untouched.
 */
export function isSheetsSource(url: string | undefined | null): boolean {
  if (!url) return false;
  let u = url;
  try { u = decodeURIComponent(url); } catch { /* keep raw */ }
  return /docs\.google\.com(\/|%2F)spreadsheets/i.test(u) || /docs\.google\.com\/spreadsheets/i.test(url);
}

/**
 * True for Internet Archive sources — either a direct archive.org URL or the
 * `pdf-proxy?kind=archive` wrapper. Used solely to pick archive-only pdf.js
 * loader options (bigger range chunks, no background auto-fetch).
 */
export function isArchiveSource(url: string | undefined | null): boolean {
  if (!url) return false;
  let u = url;
  try { u = decodeURIComponent(url); } catch { /* keep raw */ }
  if (/[?&]kind=archive\b/i.test(url) || /[?&]kind=archive\b/i.test(u)) return true;
  return /(^|\/\/|\.)archive\.org(\/|$)/i.test(u);
}
