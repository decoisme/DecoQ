/**
 * SHA-256 Hash Utility untuk QRIS Verification
 * Menggunakan Web Crypto API (native browser + Node.js)
 */

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Normalisasi QRIS string sebelum di-hash
 * Hapus whitespace, normalize line endings
 */
export function normalizeQRIS(raw: string): string {
  return raw.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/**
 * Generate hash dari raw QRIS data
 */
export async function generateQRISHash(rawData: string): Promise<string> {
  const normalized = normalizeQRIS(rawData)
  return sha256(normalized)
}
