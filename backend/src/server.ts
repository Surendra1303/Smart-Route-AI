import app from "./app";
import { env } from "./config/env";
import { initDb } from "./lib/prisma";

initDb().then(() => {
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
});
