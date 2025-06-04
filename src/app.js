import { sendInvoices } from "./invoiceService.js";

const SERVER_PORT = 8000;
const SERVER_HOSTNAME = "localhost";

const serverConfiguration = {
  port: SERVER_PORT,
  hostname: SERVER_HOSTNAME,
};

const INVOICE_WEBHOOK_ROUTE = "/invoice-webhook";
async function invoiceWebhookHandler(req) {
  await console.log(JSON.stringify(req.body));
  return new Response("OK");
}

const ROUTES = [
  {
    pattern: new URLPattern({ pathname: INVOICE_WEBHOOK_ROUTE }),
    handler: invoiceWebhookHandler,
  },
];

async function handler(req) {
  const url = new URL(req.url);

  for (const route of ROUTES) {
    const match = route.pattern.exec(url);

    if (match) {
      return await route.handler(req);
    }
  }
}

Deno.cron("Trigger invoice creation", { minute: { every: 1 } }, async () => {
  await sendInvoices();
});

Deno.serve(serverConfiguration, handler);
