import { initStarkbank } from "./auth.js";
import { NAMES } from "./names.js";
import { generate as generateCNPJ } from "@tiagoporto/gerador-validador-cnpj";

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
      taxId = generateCNPJ();
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

const MIN_INVOICES = 8;
const MAX_INVOICES = 12;
export async function sendInvoices(starkbank) {
  const invoiceList = generateRandomInvoices(MIN_INVOICES, MAX_INVOICES);

  await starkbank.invoice.create(invoiceList);
}
