// -----------------------------------------------------------------------------
// Cryptographic Module (Web Crypto API)
// -----------------------------------------------------------------------------

// Constants
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256;
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12; // Standard for GCM

// Helpers for ArrayBuffer <-> Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// 1. Key Derivation (PBKDF2)
// Derives a master key from the user's passcode and a salt.
export async function deriveKey(passcode: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false, // Key is not extractable
    ['encrypt', 'decrypt']
  );
}

// We also need a signing key (HMAC) derived from the same source but different usage
export async function deriveSigningKey(passcode: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify']
  );
}

// 2. Encryption (AES-GCM)
export async function encryptData(data: object, passcode: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
  // Generate random salt and IV
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

  // Derive key
  const key = await deriveKey(passcode, salt);

  // Encode data
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));

  // Encrypt
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedData
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
  };
}

// 3. Decryption (AES-GCM)
export async function decryptData<T>(encryptedPackage: { ciphertext: string; iv: string; salt: string }, passcode: string): Promise<T> {
  const salt = base64ToArrayBuffer(encryptedPackage.salt);
  const iv = base64ToArrayBuffer(encryptedPackage.iv);
  const ciphertext = base64ToArrayBuffer(encryptedPackage.ciphertext);

  // Derive key
  const key = await deriveKey(passcode, salt);

  try {
    // Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Decryption failed:", e);
    throw new Error('Invalid passcode or corrupted file.');
  }
}

// 4. Signing (HMAC-SHA256)
export async function signData(data: object, passcode: string, saltBase64: string): Promise<string> {
  const salt = base64ToArrayBuffer(saltBase64);
  const key = await deriveSigningKey(passcode, salt);
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));

  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    key,
    dataBuffer
  );

  return arrayBufferToBase64(signatureBuffer);
}

// 5. Verification (HMAC-SHA256)
export async function verifySignature(data: object, signatureBase64: string, passcode: string, saltBase64: string): Promise<boolean> {
  const salt = base64ToArrayBuffer(saltBase64);
  const key = await deriveSigningKey(passcode, salt);
  const signature = base64ToArrayBuffer(signatureBase64);

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));

  return window.crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    dataBuffer
  );
}
