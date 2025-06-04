import starkbank from "starkbank";

export async function initStarkbank() {
  const stark = starkbank;
  return await authFromEnv(stark);
}

const ENV_TYPE_VAR = "ENV_TYPE";
const PROJECT_ID_VAR = "PROJECT_ID";
const PRIVATE_KEY_VAR = "PRIVATE_KEY";

const env = Deno.env.get(ENV_TYPE_VAR);

const projectId = Deno.env.get(PROJECT_ID_VAR);

const privateKey = Deno.env.get(PRIVATE_KEY_VAR);

function authFromEnv(starkbank) {
  const user = new starkbank.Project({
    environment: env,
    id: projectId,
    privateKey: privateKey,
  });

  starkbank.user = user;
  return starkbank;
}

const encoder = new TextEncoder();

/** Sign a message using an HMAC secret */
export async function signPayload(payload, timestamp, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  const data = `${timestamp}:${body}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Verify a request using the shared HMAC secret */
export async function verifyInternalRequest({
  body,
  timestamp,
  signature,
  secret,
  maxSkewMs = 30000,
}) {
  const now = Date.now();
  const tsNum = Number(timestamp);
  if (isNaN(tsNum) || Math.abs(now - tsNum) > maxSkewMs) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const data = `${timestamp}:${body}`;
  const sigBytes = Uint8Array.from(
    signature.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
  );

  return await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(data),
  );
}

export async function authInternalRequest(req) {
  const signature = req.headers.get("X-Signature") || "";
  const timestamp = req.headers.get("X-Timestamp") || "";
  const secret = Deno.env.get("API_HMAC_SECRET");

  return await verifyInternalRequest({
    body: "",
    timestamp,
    signature,
    secret,
  });
}

const TIME_PERIOD_API_KEY_VAR = "TIME_PERIOD_API_KEY";
const TIME_PERIOD_API_KEY = Deno.env.get(TIME_PERIOD_API_KEY_VAR);
export function isSetTimePeriodAuth(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${TIME_PERIOD_API_KEY}`) {
    return false;
  }

  return true;
}

const STARK_BANK_API_URL_VAR = "STARK_BANK_API";
const STARK_BANK_API_URL = Deno.env.get(STARK_BANK_API_URL_VAR);
async function getStarkbankPublicKey() {
  const starkbankPublicKeyUrl = STARK_BANK_API_URL + "/v2/public-key";

  try {
    const response = await fetch(starkbankPublicKeyUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch public key: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (
      !data.publicKeys ||
      !Array.isArray(data.publicKeys) ||
      data.publicKeys.length === 0
    ) {
      throw new Error("No public keys found in response");
    }

    const publicKey = data.publicKeys[0];

    if (!publicKey.content) {
      throw new Error("Public key content not found");
    }

    return publicKey.content;
  } catch (error) {
    throw new Error(
      `Error fetching public key: ${error.message || "Unknown error"}`,
    );
  }
}
