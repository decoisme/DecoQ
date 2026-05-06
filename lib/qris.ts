/**
 * QRIS EMV TLV Parser & Merchant Info Extractor
 * Implements EMV QRCPS Merchant Presented Mode standard
 */

/**
 * Parse EMV TLV (Tag-Length-Value) string into a Map
 * Format: TTLLVV where TT=tag(2), LL=length(2), VV=value(LL)
 */
export function parseEMV(payload: string): Map<string, string> {
  const tags = new Map<string, string>();
  let i = 0;

  while (i < payload.length) {
    if (i + 4 > payload.length) break; // Need at least tag + length

    const tag = payload.substring(i, i + 2);
    const lenStr = payload.substring(i + 2, i + 4);
    const len = parseInt(lenStr, 10);

    if (isNaN(len) || i + 4 + len > payload.length) break;

    const value = payload.substring(i + 4, i + 4 + len);
    tags.set(tag, value);
    i += 4 + len;
  }

  return tags;
}

/**
 * Validate if payload is a valid QRIS
 * Tag 00 (Payload Format Indicator) must equal "01"
 */
export function isValidQRIS(rawPayload: string): boolean {
  try {
    const tags = parseEMV(rawPayload);
    return tags.get("00") === "01";
  } catch {
    return false;
  }
}

/**
 * Extract Merchant Name and NMID from QRIS payload
 */
export interface QRISMerchantInfo {
  merchantName: string | null;
  merchantId: string | null;
  merchantCity: string | null;
}

export function extractQRISMerchantInfo(rawPayload: string): QRISMerchantInfo {
  const tags = parseEMV(rawPayload);

  // Tag 59 = Merchant Name
  const merchantName = tags.get("59") ?? null;

  // Tag 26 = Merchant Account Info (contains NMID in sub-tag 01)
  const tag26 = tags.get("26") ?? "";
  const subTags = parseEMV(tag26);
  const merchantId = subTags.get("01") ?? null;

  // Tag 60 = Merchant City
  const merchantCity = tags.get("60") ?? null;

  return { merchantName, merchantId, merchantCity };
}

/**
 * Validate merchant info format
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateMerchantInfo(
  info: QRISMerchantInfo,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!info.merchantName?.trim()) {
    errors.push({
      field: "merchantName",
      message: "Nama merchant tidak ditemukan di QRIS.",
    });
  }

  // NMID format: "ID" + 13 digits (Indonesian QRIS standard)
  if (!info.merchantId || !/^ID\d{13}$/.test(info.merchantId)) {
    errors.push({
      field: "merchantId",
      message: "ID Merchant (NMID) tidak valid atau tidak ditemukan.",
    });
  }

  return errors;
}

/**
 * Decode QR code from image file using jsQR
 */
export async function decodeQRFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas context tidak tersedia");
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Dynamic import jsQR
        const jsQR = (await import("jsqr")).default;
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        URL.revokeObjectURL(url);

        if (!result || !result.data) {
          reject(new Error("QR code tidak terdeteksi dalam gambar"));
        } else {
          resolve(result.data);
        }
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat gambar"));
    };

    img.src = url;
  });
}
