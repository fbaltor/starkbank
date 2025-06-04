import { signPayload } from "../auth.js";

invoiceTrigger();
Deno.cron("Trigger invoice creation", { minute: { every: 1 } }, async () => {
  await invoiceTrigger();
});

async function invoiceTrigger() {
  const secret = Deno.env.get("CRON_HMAC_SECRET");
  const timestamp = Date.now().toString();

  const signature = await signPayload("", timestamp, secret);

  const SERVER_URL = "http://localhost:8000";
  await fetch(SERVER_URL, {
    method: "POST",
    headers: {
      "X-Signature": signature,
      "X-Timestamp": timestamp,
    },
  });
}
