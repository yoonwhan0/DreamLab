import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { handler as interpretHandler } from "../netlify/functions/interpret-dream";

export const config = {
  maxDuration: 60,
};

function toNetlifyEvent(req: Request, body: string): HandlerEvent {
  return {
    httpMethod: req.method,
    body,
    headers: Object.fromEntries(req.headers.entries()),
    isBase64Encoded: false,
    path: new URL(req.url).pathname,
    rawUrl: req.url,
    rawQuery: new URL(req.url).search,
    queryStringParameters: Object.fromEntries(new URL(req.url).searchParams),
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    route: undefined,
  } as HandlerEvent;
}

const emptyContext = {} as HandlerContext;

/** Vercel Serverless — 기존 interpret-dream 로직 재사용 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.text();
  const result = await (interpretHandler as Handler)(
    toNetlifyEvent(req, body),
    emptyContext,
  );

  const status = result.statusCode ?? 500;
  const contentType =
    status === 200 ? "application/json; charset=utf-8" : "text/plain; charset=utf-8";

  return new Response(result.body ?? "", {
    status,
    headers: { "Content-Type": contentType },
  });
}
