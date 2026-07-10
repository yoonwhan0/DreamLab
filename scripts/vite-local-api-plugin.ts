/**
 * 로컬 Vite dev — /api/* Netlify 핸들러 프록시
 */
import type { Plugin, ViteDevServer } from "vite";
import type { Handler, HandlerEvent } from "@netlify/functions";

function toHandlerEvent(req: import("http").IncomingMessage, body: string): HandlerEvent {
  const url = req.url ?? "/";
  return {
    httpMethod: req.method ?? "GET",
    body,
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.join(", ") : String(v ?? ""),
      ]),
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

type HandlerLoader = () => Promise<Handler>;

export function localApiPlugin(routes: Record<string, HandlerLoader>): Plugin {
  const handlers = new Map<string, Handler>();

  return {
    name: "dreamlab-local-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        const loader = routes[path ?? ""];
        if (!loader) {
          next();
          return;
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          if (!handlers.has(path!)) {
            handlers.set(path!, await loader());
          }
          const handler = handlers.get(path!)!;
          const body =
            req.method === "GET" || req.method === "HEAD" ? "" : await readBody(req);
          const result = await handler(toHandlerEvent(req, body), {} as never);
          res.statusCode = result.statusCode ?? 500;
          const isJson =
            typeof result.body === "string" &&
            (result.body.startsWith("{") || result.body.startsWith("["));
          res.setHeader(
            "Content-Type",
            isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
          );
          res.end(result.body ?? "");
        } catch (err) {
          console.error(`[local-api] ${path} error:`, err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Internal Server Error");
        }
      });
    },
  };
}
