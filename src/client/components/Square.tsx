interface SquareProps {
  row: number;
  col: number;
  playerName?: string;
  squareName?: string | null;
  revealed: boolean;
  onClick: () => void;
}

export default function Square({ playerName, squareName, revealed, onClick }: SquareProps) {
  const claimed = !!playerName;

  return (
    <button
      onClick={onClick}
      disabled={revealed && !claimed}
      className={`
        aspect-square w-full flex flex-col items-center justify-center text-[8px] sm:text-xs overflow-hidden
        border border-gray-300 transition-colors
        ${claimed
          ? "bg-blue-100 hover:bg-blue-200 cursor-pointer"
          : revealed
            ? "bg-gray-50 cursor-default"
            : "bg-white hover:bg-green-50 cursor-pointer"
        }
      `}
    >
      {claimed && (
        <>
          <span className="font-semibold truncate w-full px-0.5 text-center">
            {playerName}
          </span>
          {squareName && (
            <span className="text-gray-500 truncate w-full px-0.5 text-center text-[6px] sm:text-[10px]">
              {squareName}
            </span>
          )}
        </>
      )}
    </button>
  );
}
