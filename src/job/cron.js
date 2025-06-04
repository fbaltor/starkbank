import { signPayload } from "../auth.js";

Deno.cron("Trigger invoice creation", { minute: { every: 1 } }, async () => {
  await invoiceTrigger();
});

async function invoiceTrigger() {
  const secret = Deno.env.get("CRON_HMAC_SECRET");
  const timestamp = Date.now().toString();

  const signature = await signPayload("", timestamp, secret);

  const INVOICE_BASE_URL = "http://localhost:8000";
  const TRIGGER_INVOICE_ROUTE = "/invoice";
  const TRIGGER_INVOICE_URL = INVOICE_BASE_URL + TRIGGER_INVOICE_ROUTE;
  await fetch(TRIGGER_INVOICE_URL, {
    method: "POST",
    headers: {
      "X-Signature": signature,
      "X-Timestamp": timestamp,
    },
  });
}
