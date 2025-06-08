import starkbank from "starkbank";
import { Buffer } from "node:buffer";

export async function initStarkbank() {
  const stark = starkbank;
  return await authFromEnv(stark);
}

const env = Deno.env.get("ENV_TYPE");
const projectId = Deno.env.get("PROJECT_ID");
let privateKey = Deno.env.get("PRIVATE_KEY");
privateKey = Buffer.from(privateKey, "base64").toString("ascii");

function authFromEnv(starkbank) {
  const user = new starkbank.Project({
    environment: env,
    id: projectId,
    privateKey: privateKey,
  });

  starkbank.user = user;
  return starkbank;
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

