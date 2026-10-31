import { createServer } from "node:http";
import { createApp } from "./app.ts";

const port = Number(process.env.PORT ?? 3000);
createServer(createApp()).listen(port, () => {
  console.log(`orders-api listening on http://localhost:${port}`);
});
