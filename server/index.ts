import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import * as postgres from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const PORT = Number() || 80;

const app = new Application();
const router = new Router();

function registerPointView(params: { uuid: string }): string {
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Register Point</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="stylesheet" href="https://unpkg.com/open-props"/>
        <link rel="stylesheet" href="https://unpkg.com/open-props/normalize.min.css"/>
        <link rel="stylesheet" href="https://unpkg.com/open-props/buttons.min.css"/>
      </head>

      <body>
        <form action="/point/register" method="POST">
          <fieldset>
            <legend>Point</legend>

            <p>
              <label for="uuid">uuid</label>
              <input id="uuid" type="text" name="uuid" value="${params.uuid}" readonly required tabindex="-1"/>
            </p>

            <p>
              <label for="number">number</label>
              <input id="number" type="number" name="number" required tabindex="1"/>
            </p>
          </fieldset>

          <fieldset>
            <legend>Coordinate</legend>

            <label for="latitude">latitude</label>
            <input id="latitude" type="number" name="latitude" readonly required tabindex="-1"/>

            <label for="longitude">longitude</label>
            <input id="longitude" type="number" name="longitude" readonly required tabindex="-1"/>
          </fieldset>

          <input type="submit" value="Registeer punt" tabindex="1"/>
        </form>

        <style>
          html {
            padding: var(--size-fluid-2);
          }

          form {
            display: grid;
            gap: var(--size-2);
          }
        </style>

        <script >
          const longitude = document.getElementById('longitude');
          const latitude = document.getElementById('latitude');

          navigator.geolocation.watchPosition((geolocation) => {
            latitude.value = geolocation.coords.latitude;
            longitude.value = geolocation.coords.longitude;
          });
        </script>
      </body>
    </html>`;
}

interface Point {
  uuid: string;
  number: number;
  position: Position;
}

interface Position {
  longitude: number;
  latitude: number;
}

const database = new postgres.Client({
  user: Deno.env.get("PG_USER"),
  database: Deno.env.get("PG_DATABASE"),
  hostname: Deno.env.get("PG_HOST"),
  password: Deno.env.get("PG_PASSWORD"),
});

interface DbPoint {
  uuid: string;
  number: number;
  longitude: number;
  latitude: number;
}

function toPoint({ uuid, number, ...position }: DbPoint): Point {
  return {
    uuid,
    number,
    position,
  };
}

async function getPointByUuid(uuid: string): Promise<Point | undefined> {
  return await database
    .queryObject<DbPoint>`SELECT FROM points WHERE uuid = ${uuid}`
    .then((result) => {
      if (result.rowCount == 0) {
        return undefined;
      }

      return toPoint(result.rows[0]);
    });
}

async function getAllPoints(): Promise<Array<Point>> {
  return await database
    .queryObject<DbPoint>`SELECT * FROM points;`
    .then((result) => result.rows)
    .then((points) => points.map(toPoint))
    .catch(e => { console.log(e); return Promise.reject(e);})

}

async function insertPoint(point: Point): Promise<void> {
  await database
    .queryObject({
      text:
        "INSERT INTO points ( uuid, number, longitude, latitude ) VALUES ( $1, $2, $3, $4 );",
      args: [
        point.uuid,
        point.number,
        point.position.longitude,
        point.position.latitude,
      ],
    })
}

router
  .get("/", (ctx) => ctx.response.body = "Hello chasers")
  .get("/point/:uuid", async (ctx) => {
    // Check if the uuid exitss
    const point = await getPointByUuid(ctx.params.uuid);

    if (!point) {
      ctx.response.body = registerPointView({ uuid: ctx.params.uuid });
      return;
    }

    ctx.response.body = ctx.params.uuid;
  })
  .get("/point", async (ctx) => {
    ctx.response.body = await getAllPoints();
  })
  .post("/point/register", async (ctx) => {
    const value = await ctx.request.body({ type: "form" }).value;

    await insertPoint({
      uuid: value.get("uuid") as string,
      number: Number(value.get("point")),
      position: {
        latitude: Number(value.get("latitude")),
        longitude: Number(value.get("longitude")),
      },
    });

    ctx.response.redirect(`/point/${value.get('uuid')}`);
  });

app.use(router.routes());

await app.listen({ port: PORT });
