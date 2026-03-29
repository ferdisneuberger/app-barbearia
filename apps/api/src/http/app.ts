import express from "express";
import { router } from "./routes.ts";
import { errorHandler, notFoundHandler } from "./utils.ts";

const CORS_ALLOW_ORIGIN = "*";
const CORS_ALLOW_HEADERS = "content-type,authorization";
const CORS_ALLOW_METHODS = "GET,POST,PATCH,DELETE,OPTIONS";

export function createApp() {
  const app = express();

  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN);
    response.setHeader("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
    response.setHeader("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json());
  app.use(router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
