import React, { useState, useEffect } from "react";
import { XCircle } from "react-feather";

// BINGO category ranges
const CATEGORIES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

const getCardGrid = (card) => {
  const grid = [];
  const columns = ["B", "I", "N", "G", "O"];
  for (let i = 0; i < 5; i++) {
    grid.push([]);
    for (let j = 0; j < 5; j++) {
      grid[i].push(card[columns[j]][i]);
    }
  }
  return grid;
};

const isMarked = (num, calledNumbersSet) =>
  num === null || calledNumbersSet.has(num);

// ✅ Auto calculate winning pattern dynamically
const getWinningCells = (grid, calledNumbersSet) => {
  const winningCells = new Set();

  // Rows
  for (let r = 0; r < 5; r++) {
    if (grid[r].every((num) => isMarked(num, calledNumbersSet))) {
      for (let c = 0; c < 5; c++) winningCells.add(`${r},${c}`);
    }
  }

  // Columns
  for (let c = 0; c < 5; c++) {
    if (grid.every((row) => isMarked(row[c], calledNumbersSet))) {
      for (let r = 0; r < 5; r++) winningCells.add(`${r},${c}`);
    }
  }

  // Diagonal ↘
  if ([0, 1, 2, 3, 4].every((i) => isMarked(grid[i][i], calledNumbersSet))) {
    for (let i = 0; i < 5; i++) winningCells.add(`${i},${i}`);
  }

  // Diagonal ↙
  if (
    [0, 1, 2, 3, 4].every((i) => isMarked(grid[i][4 - i], calledNumbersSet))
  ) {
    for (let i = 0; i < 5; i++) winningCells.add(`${i},${4 - i}`);
  }

  return winningCells;
};

export default function WinningCardsModal({
  isOpen,
  onClose,
  winningCardIds,
  allBingoCards,
  calledNumbersSet,
  status = "won",
  failedCards,
  language,
}) {
  const [checkedFailedCards, setCheckedFailedCards] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    let audioPath = "";
    let ttsMessage = "";

    if (status === "won" && winningCardIds.length > 0) {
      audioPath = language === "Arabic" ? "/game/arabic/win.mp3" : "";
      ttsMessage = language !== "Arabic" ? "This player won" : "";
    } else if (status === "failed") {
      audioPath = language === "Arabic" ? "/game/arabic/failed.mp3" : "";
      ttsMessage = language !== "Arabic" ? "This player lost" : "";
    }

    if (language === "Arabic" && audioPath) {
      const audio = new Audio(audioPath);
      audio.volume = 1;
      audio.play().catch((err) => console.warn("Audio play error:", err));
    } else if (language !== "Arabic" && ttsMessage) {
      const utterance = new SpeechSynthesisUtterance(ttsMessage);
      utterance.lang = "en-US";
      utterance.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [isOpen, status, winningCardIds, language]);

  if (!isOpen) return null;

  const displayedCards =
    status === "failed"
      ? allBingoCards.filter((card) => failedCards.includes(card.card_id))
      : allBingoCards.filter((card) => winningCardIds.includes(card.card_id));

  const isCardChecked = (cardId) => checkedFailedCards.includes(cardId);

  const handleMarkAsChecked = (cardId) => {
    if (!isCardChecked(cardId)) {
      setCheckedFailedCards((prev) => [...prev, cardId]);
    }
    const audio = new Audio("/game/lock.m4a");
    audio.play().catch(() => {});
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-gradient-to-b from-slate-900 via-purple-900 to-black">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 w-full max-w-7xl max-h-[95vh] overflow-y-auto relative text-white">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-yellow-400 hover:text-yellow-300 transition"
          aria-label="Close modal"
        >
          <XCircle size={32} />
        </button>

        <h2
          className={`text-5xl font-extrabold mb-8 text-center drop-shadow-lg ${
            status === "won" ? "text-yellow-400" : "text-red-400"
          }`}
        >
          {status === "won"
            ? `🎉 ${displayedCards.length} Winning Card${
                displayedCards.length > 1 ? "s" : ""
              }!`
            : `❌ ${displayedCards.length} Failed Card${
                displayedCards.length > 1 ? "s" : ""
              }!`}
        </h2>

        {displayedCards.length === 0 ? (
          <p className="text-center text-xl text-white/70">
            No cards to display yet.
          </p>
        ) : (
          <div className="max-h-[80vh] overflow-y-auto pr-2 flex justify-center">
            <div
              className={`${
                displayedCards.length === 1
                  ? "w-full max-w-lg"
                  : "grid gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              }`}
            >
              {displayedCards.map((card, idx) => {
                const grid = getCardGrid(card);
                const winningCells = getWinningCells(grid, calledNumbersSet);
                const columns = ["B", "I", "N", "G", "O"];
                const alreadyChecked =
                  status === "failed" && isCardChecked(card.card_id);

                return (
                  <div
                    key={card.card_id}
                    className={`flex flex-col items-center border border-white/20 rounded-2xl p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 shadow-lg ${
                      displayedCards.length === 1 ? "mx-auto" : ""
                    }`}
                  >
                    <span className="text-sm text-white/60 mb-2">
                      {status === "failed"
                        ? `Card#${idx + 1}`
                        : `Winner#${idx + 1}`}
                    </span>
                    <h3 className="text-3xl font-extrabold text-yellow-300 mb-6 drop-shadow-lg">
                      Card ID: {card.card_id}
                    </h3>

                    {status === "failed" && !alreadyChecked && (
                      <button
                        onClick={() => handleMarkAsChecked(card.card_id)}
                        className="mb-6 px-5 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition shadow-md"
                      >
                        LOCK
                      </button>
                    )}

                    {status === "failed" && alreadyChecked && (
                      <p className="text-red-400 font-semibold mb-6">
                        This card is already checked.
                      </p>
                    )}

                    {/* BINGO Header */}
                    <div className="grid grid-cols-5 gap-1 mb-3 w-full max-w-xs">
                      {columns.map((col) => (
                        <div
                          key={col}
                          className="bg-purple-800 text-yellow-300 font-bold p-3 text-center rounded-t-lg shadow-md"
                        >
                          {col}
                        </div>
                      ))}
                    </div>

                    {/* 5x5 Grid */}
                    <div className="space-y-1 w-full max-w-xs">
                      {grid.map((row, r) => (
                        <div key={r} className="grid grid-cols-5 gap-1">
                          {row.map((num, c) => {
                            const key = `${r},${c}`;
                            const isWin = winningCells.has(key);
                            const marked = isMarked(num, calledNumbersSet);

                            return (
                              <div
                                key={key}
                                className={`p-3 text-center font-bold rounded-lg border border-white/20 text-lg transition-all duration-300
                                  ${
                                    num === null
                                      ? "bg-purple-700 text-yellow-200"
                                      : isWin
                                      ? "bg-green-500 text-white font-extrabold animate-pulse shadow-green-400/60" // 🟩 Winning
                                      : marked
                                      ? "bg-yellow-400 text-blue-900 font-bold shadow-yellow-400/50" // 🟨 Called
                                      : "bg-purple-800 text-white/80"
                                  }`}
                              >
                                {num === null
                                  ? "FREE"
                                  : num.toString().padStart(2, "0")}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
