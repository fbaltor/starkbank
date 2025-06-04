import { initStarkbank } from "../auth.js";

const starkbank = await initStarkbank();

(async () => {
  const workspaces = await starkbank.workspace.query();

  for await (const workspace of workspaces) {
    console.log(workspace);
  }
})();
