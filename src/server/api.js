import { authInternalRequest } from "../auth.js";
import { sendInvoices } from "./invoiceService.js";

const SERVER_PORT = 8000;
const SERVER_HOSTNAME = "localhost";

const serverConfiguration = {
  port: SERVER_PORT,
  hostname: SERVER_HOSTNAME,
};

const INVOICE_ROUTE = "/invoice";
async function invoiceHandler(req) {
  if (!(await authInternalRequest(req))) {
    return new Response("Unauthorized", { status: 403 });
  }

  await sendInvoices();
  return new Response("OK");
}

const INVOICE_WEBHOOK_ROUTE = "/invoice-webhook";
async function invoiceWebhookHandler(req) {
  await console.log(JSON.stringify(req.body));
  return new Response("OK");
}

const ROUTES = [
  {
    pattern: new URLPattern({ pathname: INVOICE_ROUTE }),
    handler: invoiceHandler,
  },
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

Deno.serve(serverConfiguration, handler);
