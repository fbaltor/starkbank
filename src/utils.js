import starkbank from "starkbank";
import { NAMES } from "./names.js";

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

function getRandomCPF() {
  const n = () => Math.floor(Math.random() * 900 + 100);
  const d = () => Math.floor(Math.random() * 90 + 10);
  return `${n()}.${n()}.${n()}-${d()}`;
}

function getRandomPersonList(nameArray, min, max) {
  const targetSize = Math.min(
    Math.floor(Math.random() * (max - min + 1)) + min,
    nameArray.length,
  );

  const usedTaxIds = new Set();
  const usedIndexes = new Set(); // Optional: to avoid name repeats
  const result = [];

  while (result.length < targetSize) {
    const index = Math.floor(Math.random() * nameArray.length);
    if (usedIndexes.has(index)) continue; // Avoid repeating names
    usedIndexes.add(index);

    let taxId;
    let attempts = 0;
    do {
      taxId = getRandomCPF();
      attempts++;
      if (attempts > 100) break;
    } while (usedTaxIds.has(taxId));
    usedTaxIds.add(taxId);

    result.push({ name: nameArray[index], taxId });
  }

  return result;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomInvoicesFromList(personList, min, max) {
  const size = getRandomInt(min, max);
  const result = [];

  for (let i = 0; i < size; i++) {
    const person = personList[getRandomInt(0, personList.length - 1)];
    const amount = getRandomInt(1, 1000); // You can change the amount range

    result.push({
      amount: amount,
      taxId: person.taxId,
      name: person.name,
    });
  }

  return result;
}

function generateRandomInvoices(min, max) {
  const personList = getRandomPersonList(NAMES, min, max);

  return generateRandomInvoicesFromList(personList, min, max);
}

console.log(generateRandomInvoices(1, 10));
