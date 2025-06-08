import { Buffer } from "node:buffer";

export async function convertKey(file) {
  const key = await Deno.readTextFile(file);
  const buff = Buffer.from(key).toString("base64");
  console.log(buff);
}

if (import.meta.main) {
  await convertKey(Deno.args[0]);
}
