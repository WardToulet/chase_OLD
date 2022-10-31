import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const PORT = Number(Deno.env.get('PORT')) || 80;

const app = new Application();
const router = new Router();

router
  .get('/', ctx => ctx.response.body = 'Hello chasers');

app.use(router.routes());

await app.listen({ port: PORT });
