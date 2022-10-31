import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import * as postgres from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { viewEngine, handlebarsEngine, oakAdapter } from "https://deno.land/x/view_engine@v10.6.0/mod.ts"
// import { uuidToBytes } from "https://deno.land/std@0.161.0/uuid/_common.ts"

const PORT = Number() || 80;

const app = new Application();
const router = new Router();

interface Point {
  uuid: string,
  number: number,
  position: Position,
}

interface Position {
  longitude: number,
  latitude: number,
}

const database = new postgres.Client({
  user: Deno.env.get('PG_USER'),
  database: Deno.env.get('PG_DATABASE'),
  hostname: Deno.env.get('PG_HOST'),
  password: Deno.env.get('PG_PASSWORD')
});


interface DbPoint {
  uuid: string,
  number: number,
  longitude: number,
  latitude: number,
}
function toPoint({ uuid, number, ...position }: DbPoint): Point {
  return {
    uuid,
    number,
    position
  }
}
async function getPointByUuid(uuid: string): Promise<Point | undefined> {
  return await database
    .queryObject<DbPoint>`SELECT FROM points WHERE uuid = ${uuid}`
    .then(result => {
      if(result.rowCount == 0) {
        return undefined
      }

      return toPoint(result.rows[0]);
    })

}

async function getAllPoints(): Promise<Array<Point>> {
  return await database
      .queryObject<DbPoint>`SELECT * FROM points;`
      .then(result => result.rows)
      .then(points => points.map(toPoint))
}

async function insertPoint(point: Point): Promise<Point> {
  return await database
    .queryObject<DbPoint>({
      text: 'INSERT INTO points ( uuid, number, longitude, latitude ) VALUES ( $1, $2, $3, $4 );',
      args: [ point.uuid, point.number, point.position.longitude, point.position.latitude ]
    })
    .then(result => result.rows)
    .then(points => toPoint(points[0]))

}

router
  .get('/', ctx => ctx.response.body = 'Hello chasers')
  .get('/point/:uuid', async ctx => {
    // Check if the uuid exitss
    const point = await getPointByUuid(ctx.params.uuid);

    if (!point) {
      ctx.render('register-point.hbl', { uuid: ctx.params.uuid })
      return;
    }

    ctx.response.body = ctx.params.uuid;
  })
  .get('/point', async ctx => {
    ctx.response.body = await getAllPoints();
  })
  .post('/point/register', async ctx => {
    const value = await ctx.request.body({ type: 'form'}).value;

    const point = await insertPoint({
      uuid: value.get('uuid') as string,
      number: Number(value.get('point')),
      position: {
        latitude: Number(value.get('latitude')),
        longitude: Number(value.get('longitude')),
      }
    });

    ctx.response.body = point;
  })


app.use(viewEngine(oakAdapter, handlebarsEngine, {
  viewRoot: './views'
}))
app.use(router.routes());
app.use(async ctx => {
  await ctx.send({
    root: `${Deno.cwd()}/static`
  });
})

await app.listen({ port: PORT });
