import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";
import { DomainError } from "../core/booking.ts";
import { logError } from "./logger.ts";

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void> | void
): RequestHandler {
  return async (request, response, next) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ message: "Rota nao encontrada." });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof DomainError) {
    response.status(400).json({ message: error.message });
    return;
  }

  logError("Erro interno nao tratado.", error);
  response.status(500).json({ message: "Erro interno do servidor." });
};
