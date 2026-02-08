import { Hono } from "hono";
import { createGroup, getGroup, getSquares, claimSquare, unclaimSquare } from "./db";
import type { D1Database } from "@cloudflare/workers-types";

type Bindings = {
  DB: D1Database;
  ASSETS: { fetch: typeof fetch };
};

const app = new Hono<{ Bindings: Bindings }>();

// Create a group
app.post("/api/groups", async (c) => {
  const body = await c.req.json<{ name: string }>();
  const name = body.name?.trim().toLowerCase();

  if (!name) {
    return c.json({ error: "Group name is required" }, 400);
  }

  try {
    const group = await createGroup(c.env.DB, name);
    return c.json({
      id: group.id,
      name: group.name,
      reveal_time: group.reveal_time,
      created_at: group.created_at,
    }, 201);
  } catch (e: any) {
    if (e.message?.includes("UNIQUE constraint")) {
      return c.json({ error: "A group with that name already exists" }, 409);
    }
    throw e;
  }
});

// Get a group and its squares
app.get("/api/groups/:name", async (c) => {
  const name = c.req.param("name").toLowerCase();
  const group = await getGroup(c.env.DB, name);

  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const squares = await getSquares(c.env.DB, group.id);
  const now = new Date();
  const revealTime = new Date(group.reveal_time);
  const revealed = now >= revealTime;

  return c.json({
    id: group.id,
    name: group.name,
    reveal_time: group.reveal_time,
    revealed,
    row_numbers: revealed ? JSON.parse(group.row_numbers) : null,
    col_numbers: revealed ? JSON.parse(group.col_numbers) : null,
    squares: squares.map((s) => ({
      row: s.row,
      col: s.col,
      player_name: s.player_name,
      square_name: s.square_name,
      user_id: s.user_id,
      claimed_at: s.claimed_at,
    })),
  });
});

// Claim a square
app.post("/api/groups/:name/squares", async (c) => {
  const name = c.req.param("name").toLowerCase();
  const group = await getGroup(c.env.DB, name);

  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const now = new Date();
  const revealTime = new Date(group.reveal_time);
  if (now >= revealTime) {
    return c.json({ error: "Squares are locked after reveal time" }, 403);
  }

  const body = await c.req.json<{
    row: number;
    col: number;
    playerName: string;
    squareName?: string;
    userId: string;
  }>();

  if (body.row < 0 || body.row > 9 || body.col < 0 || body.col > 9) {
    return c.json({ error: "Row and col must be between 0 and 9" }, 400);
  }

  if (!body.playerName?.trim()) {
    return c.json({ error: "Player name is required" }, 400);
  }

  if (!body.userId?.trim()) {
    return c.json({ error: "User ID is required" }, 400);
  }

  try {
    const square = await claimSquare(
      c.env.DB,
      group.id,
      body.row,
      body.col,
      body.playerName.trim(),
      body.squareName?.trim() || null,
      body.userId.trim()
    );
    return c.json(square, 201);
  } catch (e: any) {
    if (e.message?.includes("UNIQUE constraint")) {
      return c.json({ error: "This square is already claimed" }, 409);
    }
    throw e;
  }
});

// Unclaim a square
app.delete("/api/groups/:name/squares/:row/:col", async (c) => {
  const name = c.req.param("name").toLowerCase();
  const group = await getGroup(c.env.DB, name);

  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const now = new Date();
  const revealTime = new Date(group.reveal_time);
  if (now >= revealTime) {
    return c.json({ error: "Squares are locked after reveal time" }, 403);
  }

  const row = parseInt(c.req.param("row"));
  const col = parseInt(c.req.param("col"));
  const userId = c.req.query("userId");

  if (!userId) {
    return c.json({ error: "User ID is required" }, 400);
  }

  const result = await unclaimSquare(c.env.DB, group.id, row, col, userId);
  if (result === "not_found") {
    return c.json({ error: "Square not found" }, 404);
  }
  if (result === "forbidden") {
    return c.json({ error: "You can only remove your own squares" }, 403);
  }

  return c.json({ ok: true });
});

// Serve group pages with OG meta tags
app.get("/groups/:name", async (c) => {
  const name = decodeURIComponent(c.req.param("name"));
  const url = new URL(c.req.url);
  // Fetch index.html from the ASSETS binding (avoids subrequest loop)
  const assetRes = await c.env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
  const html = await assetRes.text();

  const safe = name.replace(/["<>&]/g, "");
  const title = `Join group ${safe} | Super Bowl Squares`;
  const description = `Claim your squares in the ${safe} Super Bowl Squares pool!`;

  const ogTags = `<meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta name="description" content="${description}" />
    <title>${title}</title>`;

  const injected = html.replace("<title>Super Bowl Squares</title>", ogTags);
  return c.html(injected);
});

export default app;
