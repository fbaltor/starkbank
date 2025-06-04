import { verifyRequest } from "../auth.js";

Deno.serve(
  {
    port: 8000,
    hostname: "localhost",
  },
  async (req) => {
    const sig = req.headers.get("X-Signature") || "";
    const ts = req.headers.get("X-Timestamp") || "";
    const secret = Deno.env.get("API_HMAC_SECRET");

    const valid = await verifyRequest({
      body: "",
      timestamp: ts,
      signature: sig,
      secret,
    });

    if (!valid) return new Response("Unauthorized", { status: 403 });

    // Run your cron-triggered logic here
    const validMessage = "Cron trigger accepted";
    console.log(validMessage);
    return new Response(validMessage);
  },
);
