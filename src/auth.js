import starkbank from "starkbank";

export async function initStarkbank() {
  const stark = starkbank;
  return await authFromEnv(stark);
}

const ENV_TYPE_VAR = "ENV_TYPE";
const PROJECT_ID_VAR = "PROJECT_ID";
const PRIVATE_KEY_PATH_VAR = "PRIVATE_KEY_PATH";

const env = Deno.env.get(ENV_TYPE_VAR);

const projectId = Deno.env.get(PROJECT_ID_VAR);

const privateKeyPath = Deno.env.get(PRIVATE_KEY_PATH_VAR);
const privateKey = await Deno.readTextFile(privateKeyPath);

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
