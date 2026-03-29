import { connectMongo, ensureAppDataConsistency } from "../infra/mongo.ts";
import { createApp } from "./app.ts";
import { logError, logInfo } from "./logger.ts";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
const app = createApp();

async function bootstrap() {
  await connectMongo();
  await ensureAppDataConsistency();

  app.listen(port, host, () => {
    logInfo(`API executando em http://${host}:${port}`);
  });
}

try {
  await bootstrap();
} catch (error) {
  logError("Falha ao iniciar a API", error);
  process.exit(1);
}
