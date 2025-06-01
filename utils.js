import starkbank from "starkbank";

export async function initStarkbank() {
  const stark = starkbank;

  return await authFromEnv(stark);
}

async function authFromEnv(starkbank) {
  const ENV_TYPE_VAR = "ENV_TYPE";
  const PROJECT_ID_VAR = "PROJECT_ID";
  const PRIVATE_KEY_PATH_VAR = "PRIVATE_KEY_PATH";

  const env = Deno.env.get(ENV_TYPE_VAR);

  const projectId = Deno.env.get(PROJECT_ID_VAR);

  const privateKeyPath = Deno.env.get(PRIVATE_KEY_PATH_VAR);
  const privateKey = await Deno.readTextFile(privateKeyPath);

  const user = new starkbank.Project({
    environment: env,
    id: projectId,
    privateKey: privateKey,
  });

  starkbank.user = user;
  return starkbank;
}
