import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

function getEncryptionKey(): Buffer {
  const key = process.env.AMAZON_ENCRYPTION_KEY
  
  if (!key) {
    throw new Error("AMAZON_ENCRYPTION_KEY environment variable is not set")
  }

  if (key.length < 32) {
    throw new Error("AMAZON_ENCRYPTION_KEY must be at least 32 characters long")
  }

  return crypto.scryptSync(key, "salt", KEY_LENGTH)
}

export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(token, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag()

    const result = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, "hex"),
    ]).toString("base64")

    return result
  } catch (error) {
    console.error("[v0] Error encrypting token:", error)
    throw new Error("Failed to encrypt token")
  }
}

export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey()
    const buffer = Buffer.from(encryptedToken, "base64")

    const iv = buffer.subarray(0, IV_LENGTH)
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("[v0] Error decrypting token:", error)
    throw new Error("Failed to decrypt token")
  }
}

export function generateState(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function verifyState(state1: string, state2: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(state1), Buffer.from(state2))
}
