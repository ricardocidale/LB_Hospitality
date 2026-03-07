import type { Express, Request, Response } from "express";

export function register(app: Express) {
  app.get("/api/tiles/osm/:z/:x/:y", async (req: Request, res: Response) => {
    const { z, x, y } = req.params;
    try {
      const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "HBG-Portfolio-Map/1.0" },
      });
      if (!resp.ok) {
        return res.status(resp.status).send("Tile not found");
      }
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=86400");
      const buf = Buffer.from(await resp.arrayBuffer());
      res.send(buf);
    } catch {
      res.status(502).send("Tile fetch error");
    }
  });

  app.get("/api/tiles/terrain/:z/:x/:y", async (req: Request, res: Response) => {
    const { z, x, y } = req.params;
    try {
      const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
      const resp = await fetch(url);
      if (!resp.ok) {
        return res.status(resp.status).send("Tile not found");
      }
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=86400");
      const buf = Buffer.from(await resp.arrayBuffer());
      res.send(buf);
    } catch {
      res.status(502).send("Tile fetch error");
    }
  });
}
