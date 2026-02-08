import Square from "./Square";

interface SquareData {
  row: number;
  col: number;
  player_name: string;
  square_name: string | null;
}

interface GridProps {
  revealed: boolean;
  rowNumbers: number[] | null;
  colNumbers: number[] | null;
  squares: SquareData[];
  onSquareClick: (row: number, col: number) => void;
}

export default function Grid({ revealed, rowNumbers, colNumbers, squares, onSquareClick }: GridProps) {
  const squareMap = new Map<string, SquareData>();
  for (const s of squares) {
    squareMap.set(`${s.row},${s.col}`, s);
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-0" style={{ gridTemplateColumns: `auto repeat(10, minmax(60px, 1fr))` }}>
        {/* Top-left corner: empty */}
        <div className="bg-gray-800 text-white font-bold flex items-center justify-center p-2 text-sm">

        </div>

        {/* Column headers */}
        {Array.from({ length: 10 }, (_, c) => (
          <div
            key={`col-${c}`}
            className="bg-gray-800 text-white font-bold flex items-center justify-center p-2 text-sm"
          >
            {revealed && colNumbers ? colNumbers[c] : "?"}
          </div>
        ))}

        {/* Rows */}
        {Array.from({ length: 10 }, (_, r) => (
          <>
            {/* Row header */}
            <div
              key={`row-${r}`}
              className="bg-gray-800 text-white font-bold flex items-center justify-center p-2 text-sm"
            >
              {revealed && rowNumbers ? rowNumbers[r] : "?"}
            </div>

            {/* Squares */}
            {Array.from({ length: 10 }, (_, c) => {
              const sq = squareMap.get(`${r},${c}`);
              return (
                <Square
                  key={`${r},${c}`}
                  row={r}
                  col={c}
                  playerName={sq?.player_name}
                  squareName={sq?.square_name}
                  revealed={revealed}
                  onClick={() => onSquareClick(r, c)}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
