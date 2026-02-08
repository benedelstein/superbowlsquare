import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import Grid from "../components/Grid";
import ClaimModal from "../components/ClaimModal";

interface SquareData {
  row: number;
  col: number;
  player_name: string;
  square_name: string | null;
}

interface GroupData {
  id: number;
  name: string;
  reveal_time: string;
  revealed: boolean;
  row_numbers: number[] | null;
  col_numbers: number[] | null;
  squares: SquareData[];
}

export default function Group() {
  const { name } = useParams<{ name: string }>();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [countdown, setCountdown] = useState("");

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(name!)}`);
      if (!res.ok) {
        const data: any = await res.json();
        setError(data.error || "Failed to load group");
        return;
      }
      const data: GroupData = await res.json();
      setGroup(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Countdown timer
  useEffect(() => {
    if (!group) return;

    const revealTime = new Date(group.reveal_time).getTime();

    function updateCountdown() {
      const now = Date.now();
      const diff = revealTime - now;

      if (diff <= 0) {
        setCountdown("");
        // Auto-refresh to reveal numbers
        fetchGroup();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h ${minutes}m ${seconds}s`);
      setCountdown(parts.join(" "));
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [group, fetchGroup]);

  async function handleClaim(playerName: string, squareName: string) {
    if (!selectedSquare || !group) return;

    const res = await fetch(`/api/groups/${encodeURIComponent(group.name)}/squares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        row: selectedSquare.row,
        col: selectedSquare.col,
        playerName,
        squareName: squareName || undefined,
      }),
    });

    if (!res.ok) {
      const data: any = await res.json();
      throw new Error(data.error || "Failed to claim square");
    }

    setSelectedSquare(null);
    await fetchGroup();
  }

  async function handleUnclaim() {
    if (!selectedSquare || !group) return;

    const res = await fetch(
      `/api/groups/${encodeURIComponent(group.name)}/squares/${selectedSquare.row}/${selectedSquare.col}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const data: any = await res.json();
      throw new Error(data.error || "Failed to unclaim square");
    }

    setSelectedSquare(null);
    await fetchGroup();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">{error}</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Go Home
        </Link>
      </div>
    );
  }

  if (!group) return null;

  const selectedSquareData = selectedSquare
    ? group.squares.find((s) => s.row === selectedSquare.row && s.col === selectedSquare.col)
    : null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline text-sm">
          &larr; Home
        </Link>
        <h1 className="text-2xl font-bold mt-2">{group.name}</h1>

        {group.revealed ? (
          <p className="text-green-700 font-medium mt-1">Numbers revealed! Grid is locked.</p>
        ) : countdown ? (
          <p className="text-gray-600 mt-1">
            Numbers reveal in: <span className="font-mono font-semibold">{countdown}</span>
          </p>
        ) : null}
      </div>

      {/* Team labels */}
      <div className="mb-2 flex items-end gap-2">
        <div className="w-[60px]"></div>
        <p className="text-sm font-bold text-gray-700 text-center flex-1">
          Patriots
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex items-center">
          <p
            className="text-sm font-bold text-gray-700 whitespace-nowrap"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Seahawks
          </p>
        </div>

        <div className="flex-1">
          <Grid
            revealed={group.revealed}
            rowNumbers={group.row_numbers}
            colNumbers={group.col_numbers}
            squares={group.squares}
            onSquareClick={(row, col) => {
              // If revealed and square is unclaimed, don't open modal
              const sq = group.squares.find((s) => s.row === row && s.col === col);
              if (group.revealed && !sq) return;
              setSelectedSquare({ row, col });
            }}
          />
        </div>
      </div>

      <p className="text-gray-400 text-xs mt-4">
        {group.squares.length} / 100 squares claimed
      </p>

      {selectedSquare && (
        <ClaimModal
          row={selectedSquare.row}
          col={selectedSquare.col}
          existingPlayer={selectedSquareData?.player_name}
          existingSquareName={selectedSquareData?.square_name}
          revealed={group.revealed}
          onClaim={handleClaim}
          onUnclaim={handleUnclaim}
          onClose={() => setSelectedSquare(null)}
        />
      )}
    </div>
  );
}
