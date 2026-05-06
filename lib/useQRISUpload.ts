import { useState } from "react";
import {
  decodeQRFromFile,
  extractQRISMerchantInfo,
  isValidQRIS,
  validateMerchantInfo,
  type QRISMerchantInfo,
} from "./qris";
import { sha256 } from "./hash";

export interface QRISUploadResult {
  merchantName: string | null;
  merchantId: string | null;
  merchantCity: string | null;
  hash: string;
  rawPayload: string;
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export interface QRISUploadState {
  loading: boolean;
  error: string | null;
  result: QRISUploadResult | null;
}

/**
 * React hook for handling QRIS image upload with auto-extraction
 */
export function useQRISUpload() {
  const [state, setState] = useState<QRISUploadState>({
    loading: false,
    error: null,
    result: null,
  });

  const handleUpload = async (file: File): Promise<QRISUploadResult | null> => {
    setState({ loading: true, error: null, result: null });

    try {
      // 1. Decode QR from image
      const rawPayload = await decodeQRFromFile(file);

      // 2. Validate QRIS format
      if (!isValidQRIS(rawPayload)) {
        throw new Error("Bukan QR Code QRIS yang valid.");
      }

      // 3. Extract merchant info
      const merchantInfo = extractQRISMerchantInfo(rawPayload);

      // 4. Validate merchant info
      const errors = validateMerchantInfo(merchantInfo);

      // 5. Calculate SHA-256 hash
      const hash = await sha256(rawPayload);

      const result: QRISUploadResult = {
        ...merchantInfo,
        hash,
        rawPayload,
        isValid: errors.length === 0,
        errors,
      };

      setState({ loading: false, error: null, result });
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Gagal membaca QR Code. Pastikan gambar QRIS jelas dan tidak buram.";

      setState({ loading: false, error: errorMessage, result: null });
      return null;
    }
  };

  const reset = () => {
    setState({ loading: false, error: null, result: null });
  };

  return {
    ...state,
    handleUpload,
    reset,
  };
}
