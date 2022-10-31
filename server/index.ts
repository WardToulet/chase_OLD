import { Application } from "https://deno.land/x/oak/mod.ts";

const PORT = Number(Deno.env.get('PORT')) || 80;

const app = new Application();

app.use((ctx) => {
  ctx.response.body = "Hello world!";
});

await app.listen({ port: PORT });
