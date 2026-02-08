import type { D1Database } from "@cloudflare/workers-types";

export interface Group {
  id: number;
  name: string;
  row_numbers: string;
  col_numbers: string;
  reveal_time: string;
  created_at: string;
}

export interface Square {
  id: number;
  group_id: number;
  row: number;
  col: number;
  player_name: string;
  square_name: string | null;
  user_id: string;
  claimed_at: string;
}

function shuffle(): number[] {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function createGroup(db: D1Database, name: string): Promise<Group> {
  const rowNumbers = JSON.stringify(shuffle());
  const colNumbers = JSON.stringify(shuffle());
  const revealTime = "2026-02-08T23:30:00Z"; // 5:30 PM CT

  const result = await db
    .prepare(
      "INSERT INTO groups (name, row_numbers, col_numbers, reveal_time) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .bind(name, rowNumbers, colNumbers, revealTime)
    .first<Group>();

  return result!;
}

export async function getGroup(db: D1Database, name: string): Promise<Group | null> {
  return db
    .prepare("SELECT * FROM groups WHERE name = ?")
    .bind(name)
    .first<Group>();
}

export async function getSquares(db: D1Database, groupId: number): Promise<Square[]> {
  const result = await db
    .prepare("SELECT * FROM squares WHERE group_id = ?")
    .bind(groupId)
    .all<Square>();
  return result.results;
}

export async function claimSquare(
  db: D1Database,
  groupId: number,
  row: number,
  col: number,
  playerName: string,
  squareName: string | null,
  userId: string
): Promise<Square> {
  const result = await db
    .prepare(
      "INSERT INTO squares (group_id, row, col, player_name, square_name, user_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(groupId, row, col, playerName, squareName, userId)
    .first<Square>();

  return result!;
}

export async function unclaimSquare(
  db: D1Database,
  groupId: number,
  row: number,
  col: number,
  userId: string
): Promise<"ok" | "not_found" | "forbidden"> {
  const square = await db
    .prepare("SELECT user_id FROM squares WHERE group_id = ? AND row = ? AND col = ?")
    .bind(groupId, row, col)
    .first<{ user_id: string }>();

  if (!square) return "not_found";
  if (square.user_id !== userId) return "forbidden";

  await db
    .prepare("DELETE FROM squares WHERE group_id = ? AND row = ? AND col = ?")
    .bind(groupId, row, col)
    .run();

  return "ok";
}
