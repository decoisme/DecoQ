# QRIS Library Documentation

Library untuk parsing dan validasi QRIS (Quick Response Code Indonesian Standard) sesuai standar EMV QRCPS Merchant Presented Mode.

---

## 📚 Modules

### 1. `qris.ts`

Core utilities untuk QRIS parsing dan validasi.

### 2. `useQRISUpload.ts`

React hook untuk handling QRIS upload dengan auto-extraction.

---

## 🔧 API Reference

### `parseEMV(payload: string): Map<string, string>`

Parse EMV TLV (Tag-Length-Value) string menjadi Map.

**Format EMV:**

```
TTLLVV...
TT = 2-digit tag
LL = 2-digit length
VV = value (length LL)
```

**Example:**

```typescript
import { parseEMV } from "./qris";

const payload = "000201590012Warung Makan";
const tags = parseEMV(payload);

console.log(tags.get("00")); // "01"
console.log(tags.get("59")); // "Warung Makan"
```

---

### `isValidQRIS(rawPayload: string): boolean`

Validasi apakah payload adalah QRIS yang valid.

**Kriteria:**

- Tag `00` (Payload Format Indicator) harus bernilai `"01"`

**Example:**

```typescript
import { isValidQRIS } from "./qris";

const payload = "000201..."; // QRIS payload
if (isValidQRIS(payload)) {
  console.log("Valid QRIS!");
}
```

---

### `extractQRISMerchantInfo(rawPayload: string): QRISMerchantInfo`

Extract informasi merchant dari QRIS payload.

**Returns:**

```typescript
interface QRISMerchantInfo {
  merchantName: string | null; // Tag 59
  merchantId: string | null; // Tag 26, sub-tag 01 (NMID)
  merchantCity: string | null; // Tag 60
}
```

**Example:**

```typescript
import { extractQRISMerchantInfo } from "./qris";

const payload = "000201...5912UTA-STORE...260115ID1024334862579...";
const info = extractQRISMerchantInfo(payload);

console.log(info.merchantName); // "UTA-STORE"
console.log(info.merchantId); // "ID1024334862579"
console.log(info.merchantCity); // "JAKARTA"
```

---

### `validateMerchantInfo(info: QRISMerchantInfo): ValidationError[]`

Validasi format merchant info.

**Validation Rules:**

- `merchantName` tidak boleh kosong
- `merchantId` harus format: `ID` + 13 digit angka (contoh: `ID1024334862579`)

**Returns:**

```typescript
interface ValidationError {
  field: string;
  message: string;
}
```

**Example:**

```typescript
import { validateMerchantInfo } from "./qris";

const info = {
  merchantName: "Warung Pak Budi",
  merchantId: "ID1234567890123",
  merchantCity: "Jakarta",
};

const errors = validateMerchantInfo(info);
if (errors.length === 0) {
  console.log("Valid merchant info!");
} else {
  errors.forEach((err) => {
    console.error(`${err.field}: ${err.message}`);
  });
}
```

---

### `decodeQRFromFile(file: File): Promise<string>`

Decode QR code dari file gambar menggunakan jsQR.

**Example:**

```typescript
import { decodeQRFromFile } from "./qris";

const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];

  try {
    const rawPayload = await decodeQRFromFile(file);
    console.log("QR decoded:", rawPayload);
  } catch (err) {
    console.error("Failed to decode:", err.message);
  }
});
```

---

## 🎣 React Hook: `useQRISUpload()`

Hook untuk handling QRIS upload dengan auto-extraction.

**Returns:**

```typescript
{
  loading: boolean
  error: string | null
  result: QRISUploadResult | null
  handleUpload: (file: File) => Promise<QRISUploadResult | null>
  reset: () => void
}
```

**QRISUploadResult:**

```typescript
interface QRISUploadResult {
  merchantName: string | null;
  merchantId: string | null;
  merchantCity: string | null;
  hash: string; // SHA-256 hash
  rawPayload: string; // Raw QR string
  isValid: boolean; // Validation status
  errors: ValidationError[]; // Validation errors
}
```

**Example:**

```typescript
import { useQRISUpload } from './useQRISUpload'

function QRISUploadForm() {
  const { loading, error, result, handleUpload, reset } = useQRISUpload()

  const onFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const result = await handleUpload(file)
      if (result) {
        console.log('Merchant:', result.merchantName)
        console.log('NMID:', result.merchantId)
        console.log('Hash:', result.hash)
      }
    }
  }

  return (
    <div>
      <input type="file" onChange={onFileChange} disabled={loading} />
      {loading && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      {result && (
        <div>
          <p>Merchant: {result.merchantName}</p>
          <p>NMID: {result.merchantId}</p>
          <p>City: {result.merchantCity}</p>
          <p>Hash: {result.hash}</p>
          {!result.isValid && (
            <ul>
              {result.errors.map(err => (
                <li key={err.field}>{err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 📊 QRIS Tag Reference

### Main Tags

| Tag  | Field                        | Description                   |
| ---- | ---------------------------- | ----------------------------- |
| `00` | Payload Format Indicator     | Must be "01" for valid QRIS   |
| `01` | Point of Initiation Method   | "11" = static, "12" = dynamic |
| `26` | Merchant Account Information | Contains NMID in sub-tag      |
| `52` | Merchant Category Code       | 4-digit MCC                   |
| `53` | Transaction Currency         | "360" for IDR                 |
| `54` | Transaction Amount           | Amount (dynamic QRIS only)    |
| `58` | Country Code                 | "ID" for Indonesia            |
| `59` | Merchant Name                | Display name                  |
| `60` | Merchant City                | City name                     |
| `61` | Postal Code                  | Postal code                   |
| `62` | Additional Data              | Additional info               |
| `63` | CRC                          | Checksum                      |

### Tag 26 Sub-tags (Merchant Account Info)

| Sub-tag | Field                    | Description                  |
| ------- | ------------------------ | ---------------------------- |
| `00`    | Global Unique Identifier | "ID.CO.QRIS.WWW"             |
| `01`    | NMID                     | Merchant ID (ID + 13 digits) |
| `02`    | Merchant PAN             | Primary Account Number       |
| `03`    | Merchant Criteria        | Merchant type                |

---

## 🔍 Example QRIS Payload

```
00020101021126570011ID.CO.QRIS.WWW0215ID1024334862579030103040102
52045812530336054061000062070703A01630445F3
```

**Parsed:**

```
00 02 01                    → Payload Format: "01"
01 02 11                    → Point of Initiation: "11" (static)
26 57 ...                   → Merchant Account Info (length 57)
  00 11 ID.CO.QRIS.WWW      → GUID
  01 15 ID1024334862579     → NMID
  03 01 03                  → Merchant Criteria
  04 01 02                  → Additional info
52 04 5812                  → MCC: "5812" (Eating Places)
53 03 360                   → Currency: "360" (IDR)
54 06 100000                → Amount: 100000 (dynamic only)
58 02 ID                    → Country: "ID"
59 12 UTA-STORE, TEBET      → Merchant Name
60 07 JAKARTA               → City
63 04 45F3                  → CRC
```

---

## ⚠️ Important Notes

### 1. NMID Format

NMID (Nomor Merchant ID) harus mengikuti format:

- Prefix: `ID`
- Diikuti 13 digit angka
- Total: 15 karakter
- Contoh: `ID1024334862579`

### 2. Recursive Parsing

Tag `26` (Merchant Account Info) berisi nested TLV yang harus di-parse lagi untuk mendapatkan NMID di sub-tag `01`.

```typescript
const tags = parseEMV(rawPayload);
const tag26 = tags.get("26");
const subTags = parseEMV(tag26); // Parse lagi!
const nmid = subTags.get("01");
```

### 3. SHA-256 Hash

Hash dihitung dari **raw QR payload string**, bukan dari image binary:

```typescript
import { sha256 } from "./hash";

const rawPayload = "000201..."; // decoded QR string
const hash = await sha256(rawPayload);
```

### 4. Static vs Dynamic QRIS

- **Static QRIS**: Tidak ada tag `54` (amount), bisa digunakan berkali-kali
- **Dynamic QRIS**: Ada tag `54` dengan amount, sekali pakai

---

## 🧪 Testing

### Test dengan QRIS Sample

```typescript
import {
  isValidQRIS,
  extractQRISMerchantInfo,
  validateMerchantInfo,
} from "./qris";

// Sample QRIS payload
const sampleQRIS = "000201010211265700..."; // Your QRIS here

// Test 1: Validasi format
console.assert(isValidQRIS(sampleQRIS), "Should be valid QRIS");

// Test 2: Extract merchant info
const info = extractQRISMerchantInfo(sampleQRIS);
console.log("Merchant Name:", info.merchantName);
console.log("NMID:", info.merchantId);
console.log("City:", info.merchantCity);

// Test 3: Validasi merchant info
const errors = validateMerchantInfo(info);
console.assert(errors.length === 0, "Should have no validation errors");
```

---

## 🐛 Error Handling

### Common Errors

| Error                           | Cause                    | Solution                             |
| ------------------------------- | ------------------------ | ------------------------------------ |
| "QR code tidak terdeteksi"      | Image quality rendah     | Gunakan gambar resolusi lebih tinggi |
| "Bukan QR Code QRIS yang valid" | Tag 00 ≠ "01"            | Pastikan QR adalah QRIS resmi        |
| "Format NMID tidak valid"       | NMID tidak sesuai format | Cek format: ID + 13 digit            |
| "Nama merchant tidak ditemukan" | Tag 59 tidak ada         | QRIS corrupt atau tidak lengkap      |

### Error Handling Pattern

```typescript
try {
  const rawPayload = await decodeQRFromFile(file);

  if (!isValidQRIS(rawPayload)) {
    throw new Error("Bukan QRIS yang valid");
  }

  const info = extractQRISMerchantInfo(rawPayload);
  const errors = validateMerchantInfo(info);

  if (errors.length > 0) {
    console.warn("Validation warnings:", errors);
    // Allow manual input for missing fields
  }

  // Process valid QRIS
} catch (err) {
  console.error("QRIS processing failed:", err.message);
  // Show user-friendly error message
}
```

---

## 📖 References

- [EMV QR Code Specification](https://www.emvco.com/emv-technologies/qrcodes/)
- [Bank Indonesia - QRIS Standard](https://www.bi.go.id/qris)
- [jsQR Library](https://github.com/cozmo/jsQR)

---

## 📄 License

Part of DecoQ QRIS Verification System
