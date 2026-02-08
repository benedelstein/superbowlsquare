CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  row_numbers TEXT NOT NULL,
  col_numbers TEXT NOT NULL,
  reveal_time TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE squares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  row INTEGER NOT NULL CHECK(row BETWEEN 0 AND 9),
  col INTEGER NOT NULL CHECK(col BETWEEN 0 AND 9),
  player_name TEXT NOT NULL,
  square_name TEXT,
  claimed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(group_id, row, col)
);
