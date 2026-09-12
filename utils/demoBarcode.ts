/**
 * Deterministic demo entry-barcode generator.
 *
 * When a purchased ticket has no provider re-issued barcode
 * (ownershipTransfer.newBarcode), we still want the buyer to see a scannable
 * pass in My Tickets. This derives a stable, realistic-looking code from the
 * transaction id — same id always yields the same code, no external deps.
 */
export function demoBarcodeValue(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const digits = String(h).padStart(10, "0").slice(0, 10);
  return `TIKET-${digits}`;
}

export const DEMO_BARCODE_FORMAT = "code128";
