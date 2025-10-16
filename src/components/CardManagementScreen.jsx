import React, { useState, useEffect } from "react";
import ModalReport from "./ModalReport";
import CardModal from "./showCard";

const TOTAL_CARDS = 200;
const DEFAULT_COLOR = "#3B82F6"; // blue shade

export default function CardManagementScreen({
  selectedCards,
  setCurrentView,
}) {
  const [selectedCardState, setSelectedCardState] = useState([]);
  const [cardColor, setCardColor] = useState(DEFAULT_COLOR);
  const [bet, setBet] = useState(5000);
  const [commission, setCommission] = useState("30%");
  const [interval, setInterval] = useState("4 sec");
  const [pattern, setPattern] = useState("All");
  const [language, setLanguage] = useState("Arabic");
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);

  // Initialize local selected cards state from prop if present
  useEffect(() => {
    if (selectedCards && selectedCards.length > 0) {
      setSelectedCardState(selectedCards);
    }
  }, [selectedCards]);

  // Fetch balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const shop_id = localStorage.getItem("shopid");
        const balanceRes = await fetch(
          `https://corebingoapi.onrender.com/balance/${shop_id}`
        );
        if (!balanceRes.ok) throw new Error("Failed to fetch balance");
        const { balance } = await balanceRes.json();
        setBalance(balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        alert("❌ Unable to load balance.");
      }
    };
    fetchBalance();
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    setCurrentView({ name: "login" });
  };

  // Toggle card selection
  const toggleCard = (num) => {
    setSelectedCardState((prev) => {
      const isAlreadySelected = prev.includes(num);
      if (!isAlreadySelected) {
        setSelectedCardId(num); // Open modal for this card
        // setIsModalOpen(true); // Uncomment if you want modal to open on select
        return [...prev, num];
      } else {
        return prev.filter((n) => n !== num);
      }
    });
  };

  // Close card modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCardId(null);
  };

  // Calculate prize based on bet, commission, and selected cards
  const calculatePrize = () => {
    const numSelectedCards = selectedCardState.length;
    const betAmount = bet;
    const commissionRate = parseFloat(commission) / 100;

    if (numSelectedCards === 0 || betAmount <= 0) {
      return 0;
    }

    const totalBet = numSelectedCards * betAmount;
    return totalBet * (1 - commissionRate);
  };

  // Start the game
  const startGame = async () => {
    setIsLoading(true);
    const prize = calculatePrize();
    const parsedInterval = parseInt(interval.split(" ")[0]) * 1000;

    try {
      const shopId = localStorage.getItem("shopid");

      const res = await fetch("https://corebingoapi.onrender.com/startgame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          bet_per_card: bet,
          commission_rate: parseFloat(commission) / 100,
          interval: parsedInterval,
          language: language,
          winning_pattern: pattern,
          prize: prize,
          total_cards: selectedCardState.length,
          selected_cards: selectedCardState,
        }),
      });

      if (!res.ok) throw new Error("Game creation failed");
      const { round_id } = await res.json();

      setCurrentView({
        name: "dashboard",
        props: {
          roundId: round_id,
          shopId,
          prize,
          selectedCards: selectedCardState,
          interval: parsedInterval,
          language,
          betPerCard: bet,
          commissionRate: parseFloat(commission) / 100,
          winningPattern: pattern,
        },
      });
    } catch (err) {
      console.error("Start Game Error:", err);
      alert("❌ Failed to start game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const shopId = localStorage.getItem("shopid");

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex overflow-hidden">
      {/* Sidebar Settings Panel */}
      <aside className="w-72 bg-white/5 backdrop-blur-md border-r border-white/20 p-6 flex flex-col gap-6 shadow-xl">
        <div className="pb-4 border-b border-white/20">
          <h2 className="text-lg font-bold text-yellow-300">Selected Cards</h2>
          <p className="text-3xl font-extrabold text-blue-300">
            {selectedCardState.length}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">
            Bet Per Card (SSP)
          </label>
          <input
            type="number"
            value={bet}
            onChange={(e) => setBet(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div
          className={`flex items-center gap-3 p-3 rounded-lg border border-white/20 bg-white/5 transition-filter duration-300 ${
            !blurred ? "filter blur-sm" : ""
          }`}
        >
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-semibold mb-1 text-white/70">
              Commission
            </label>
            <select
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-yellow-400"
            >
              <option>20%</option>
              <option>30%</option>
            </select>
          </div>
          <button
            onClick={() => setBlurred(!blurred)}
            className="px-3 py-2 text-sm rounded-lg bg-yellow-400 text-blue-900 font-bold hover:bg-yellow-500 transition"
          >
            {blurred ? "Unblur" : "Blur"}
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">
            Call Interval
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-yellow-400"
          >
            <option>4 sec</option>
            <option>5 sec</option>
            <option>7 sec</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">
            Winning Pattern
          </label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-yellow-400"
          >
            <option>All</option>
            <option>1 Line</option>
            <option>2 Lines</option>
            <option>Four Corners</option>
            <option>Cross</option>
            <option>Inner Corners + Center</option>
            <option>Full House</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-white/70">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-yellow-400"
          >
            <option>Arabic</option>
            <option>English</option>
          </select>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-yellow-300 drop-shadow-lg">
            الفرحة (Alfarha) Bingo
          </h1>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="text-sm md:text-base font-semibold text-blue-300 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition shadow"
              onClick={() => setShowReportModal(true)}
            >
              Reports
            </button>

            <button
              onClick={startGame}
              disabled={selectedCardState.length === 0}
              className={`px-8 py-3 rounded-xl font-bold text-white transition transform hover:scale-105 shadow-lg ${
                selectedCardState.length === 0
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Starting...
                </div>
              ) : (
                "Start Bingo Game"
              )}
            </button>

            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition shadow"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-10 md:grid-cols-12 lg:grid-cols-14 xl:grid-cols-16 gap-2 md:gap-3">
          {Array.from({ length: TOTAL_CARDS }, (_, i) => i + 1).map((num) => {
            const isSelected = selectedCardState.includes(num);
            return (
              <button
                key={num}
                onClick={() => toggleCard(num)}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-bold transition-all duration-200 transform hover:scale-110 shadow-md ${
                  isSelected
                    ? "ring-2 ring-yellow-300 bg-yellow-400 scale-105 text-blue-900"
                    : "bg-white/5 text-white hover:ring-2 hover:ring-yellow-300 border border-white/20"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </main>

      {/* Modals */}
      <ModalReport
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        shopId={shopId}
      />
      <CardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        winningCardIds={selectedCardId ? [selectedCardId] : []}
      />
    </div>
  );
}
