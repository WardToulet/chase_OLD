import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const PORT = Number(Deno.env.get('PORT')) || 80;

const app = new Application();
const router = new Router();

router
  .get('/', ctx => ctx.response.body = 'Hello chasers')
  .get('/point/:uuid', ctx => {
    ctx.response.body = ctx.params.uuid;
  })

app.use(router.routes());

await app.listen({ port: PORT });
