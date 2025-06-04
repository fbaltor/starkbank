import { sendInvoices } from "./invoiceService.js";
import { createTimePeriodService, createTimePeriod } from "./timeUtils.js";
import { initStarkbank, isSetTimePeriodAuth } from "./auth.js";
import { createTransfer } from "./transferService.js";

const starkbank = await initStarkbank();

const SERVER_PORT = 8000;
const SERVER_HOSTNAME = "localhost";

const serverConfiguration = {
  port: SERVER_PORT,
  hostname: SERVER_HOSTNAME,
};

// TODO: starkbank.event.parse not working, missing signature verification
const INVOICE_WEBHOOK_ROUTE = "/invoice-webhook";
async function invoiceWebhookHandler(req) {
  try {
    const content = await req.json();
    const event = content.event;

    if (event.log.invoice.status === "paid") {
      await createTransfer(starkbank, event);
    }

    return new Response("Ok");
  } catch (error) {
    console.log(error);
    return new Response(400);
  }
}

const SET_TIME_PERIOD_ROUTE = "/set-time-period";
async function setTimePeriodHandler(req) {
  if (!isSetTimePeriodAuth(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { duration = "PT0S" } = body; // Defaul to zero seconds (timePeriod disabled)

    const parsedDuration = Temporal.Duration.from(duration);

    const timePeriod = createTimePeriod(Temporal.Now.instant(), parsedDuration);
    await timePeriodService.set(timePeriod);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invoice processing enabled for ${duration}`,
        endTime: timePeriod.endTime.toString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          error: "Invalid request",
          details: error.message,
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
  }
}

const ROUTES = [
  {
    pattern: new URLPattern({ pathname: INVOICE_WEBHOOK_ROUTE }),
    handler: invoiceWebhookHandler,
  },
  {
    pattern: new URLPattern({ pathname: SET_TIME_PERIOD_ROUTE }),
    handler: setTimePeriodHandler,
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

  return new Response(
    JSON.stringify({
      error: "Not Found",
      path: url.pathname,
      method: req.method,
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );
}

const kv = await Deno.openKv();
const timePeriodService = createTimePeriodService(kv);
const defaultPeriod = createTimePeriod();
await timePeriodService.set(defaultPeriod);

Deno.cron("Trigger invoice creation", { minute: { every: 1 } }, async () => {
  if (await timePeriodService.isActive()) {
    await sendInvoices(starkbank);
  }
});

Deno.serve(serverConfiguration, handler);
