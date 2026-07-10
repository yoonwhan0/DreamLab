/**
 * 로컬 Vite dev — /api/interpret-dream 을 Netlify 핸들러로 처리 (Vercel 로그인 불필요)
 */
import type { Plugin, ViteDevServer } from "vite";
import type { Handler, HandlerEvent } from "@netlify/functions";

type InterpretHandler = Handler;

function toHandlerEvent(req: import("http").IncomingMessage, body: string): HandlerEvent {
  const url = req.url ?? "/";
  return {
    httpMethod: req.method ?? "GET",
    body,
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v ?? "")]),
    ),
    isBase64Encoded: false,
    path: url.split("?")[0] ?? url,
    rawUrl: `http://127.0.0.1${url}`,
    rawQuery: url.includes("?") ? url.split("?")[1]! : "",
    queryStringParameters: Object.fromEntries(new URL(`http://x${url}`).searchParams),
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    route: undefined,
  } as HandlerEvent;
}

function readBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function localApiPlugin(getHandler: () => Promise<InterpretHandler>): Plugin {
  let handler: InterpretHandler | null = null;

  return {
    name: "dreamlab-local-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        if (path !== "/api/interpret-dream") {
          next();
          return;
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Method Not Allowed");
          return;
        }

        try {
          if (!handler) handler = await getHandler();
          const body = await readBody(req);
          const result = await handler(toHandlerEvent(req, body), {} as never);
          res.statusCode = result.statusCode ?? 500;
          res.setHeader(
            "Content-Type",
            result.statusCode === 200
              ? "application/json; charset=utf-8"
              : "text/plain; charset=utf-8",
          );
          res.end(result.body ?? "");
        } catch (err) {
          console.error("[local-api] interpret-dream error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Internal Server Error");
        }
      });
    },
  };
}
