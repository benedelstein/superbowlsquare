import { useState } from "react";

interface ClaimModalProps {
  row: number;
  col: number;
  existingPlayer?: string;
  existingSquareName?: string | null;
  existingUserId?: string;
  revealed: boolean;
  onClaim: (playerName: string, squareName: string) => Promise<void>;
  onUnclaim: () => Promise<void>;
  onClose: () => void;
}

export default function ClaimModal({
  row,
  col,
  existingPlayer,
  existingSquareName,
  existingUserId,
  revealed,
  onClaim,
  onUnclaim,
  onClose,
}: ClaimModalProps) {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("playerName") || "");
  const [squareName, setSquareName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isClaimed = !!existingPlayer;
  const isOwner = isClaimed && existingUserId === localStorage.getItem("userId");

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) return;

    setLoading(true);
    setError("");
    try {
      localStorage.setItem("playerName", playerName.trim());
      await onClaim(playerName.trim(), squareName.trim());
    } catch (err: any) {
      setError(err.message || "Failed to claim square");
      setLoading(false);
    }
  }

  async function handleUnclaim() {
    setLoading(true);
    setError("");
    try {
      await onUnclaim();
    } catch (err: any) {
      setError(err.message || "Failed to unclaim square");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">
          Square ({row}, {col})
        </h3>

        {isClaimed ? (
          <div>
            <p className="text-gray-600 mb-1">
              Claimed by <span className="font-semibold">{existingPlayer}</span>
            </p>
            {existingSquareName && (
              <p className="text-gray-500 text-sm mb-4">"{existingSquareName}"</p>
            )}

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            {!revealed && isOwner && (
              <button
                onClick={handleUnclaim}
                disabled={loading}
                className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 mb-2"
              >
                {loading ? "Removing..." : "Unclaim Square"}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full border border-gray-300 py-2 rounded-md font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleClaim}>
            <p className="text-gray-500 text-sm mb-4">Claim this square</p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. John"
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Square Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={squareName}
              onChange={(e) => setSquareName(e.target.value)}
              placeholder="e.g. Lucky 7"
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <button
              type="submit"
              disabled={loading || !playerName.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            >
              {loading ? "Claiming..." : "Claim Square"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full border border-gray-300 py-2 rounded-md font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
