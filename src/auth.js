const encoder = new TextEncoder();

/** Sign a message using an HMAC secret */
export async function signPayload(payload, timestamp, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  const data = `${timestamp}:${body}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Verify a request using the shared HMAC secret */
export async function verifyRequest({ body, timestamp, signature, secret, maxSkewMs = 30000 }) {
  const now = Date.now();
  const tsNum = Number(timestamp);
  if (isNaN(tsNum) || Math.abs(now - tsNum) > maxSkewMs) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const data = `${timestamp}:${body}`;
  const sigBytes = Uint8Array.from(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  return await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
}

