function writeLine(stream: NodeJS.WriteStream, level: string, message: string) {
  stream.write(`[${level}] ${message}\n`);
}

function formatUnknownError(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return Object.prototype.toString.call(error);
  }
}

export function logInfo(message: string) {
  writeLine(process.stdout, "INFO", message);
}

export function logError(message: string, error?: unknown) {
  writeLine(process.stderr, "ERROR", message);

  if (error instanceof Error) {
    writeLine(process.stderr, "ERROR", `${error.name}: ${error.message}`);
    if (error.stack) {
      process.stderr.write(`${error.stack}\n`);
    }
    return;
  }

  if (error !== undefined) {
    process.stderr.write(`${formatUnknownError(error)}\n`);
  }
}
