import React, { useState } from "react";
import { FiAward, FiStar, FiTrendingUp, FiCheckCircle, FiZap } from "react-icons/fi";

// Actions users can take for points
const actions = [
  { id: "transit", label: "Used Public Transport", icon: "🚌", points: 50, co2: 2.1 },
  { id: "tree", label: "Planted a Tree", icon: "🌳", points: 200, co2: 22 },
  { id: "smoke", label: "Reported Smoke/Pollution", icon: "🚨", points: 75, co2: 0 },
  { id: "ev", label: "Rode Electric Vehicle", icon: "⚡", points: 100, co2: 1.5 },
  { id: "carpool", label: "Carpooled Today", icon: "🚗", points: 60, co2: 1.2 },
  { id: "wfh", label: "Worked From Home", icon: "🏠", points: 40, co2: 0.8 },
  { id: "cycle", label: "Cycled to Work", icon: "🚲", points: 80, co2: 1.8 },
  { id: "noburn", label: "Avoided Burning Waste", icon: "🔥", points: 90, co2: 5.0 },
];

// Sample leaderboard data
const leaderboard = [
  { rank: 1, name: "Priya Sharma", area: "Andheri West", points: 4280, badge: "🏆" },
  { rank: 2, name: "Rahul Gupta", area: "Connaught Place", points: 3850, badge: "🥈" },
  { rank: 3, name: "Anita Mehta", area: "Koramangala", points: 3420, badge: "🥉" },
  { rank: 4, name: "Dev Patel", area: "Bandra", points: 2900, badge: "⭐" },
  { rank: 5, name: "Sneha Joshi", area: "Salt Lake", points: 2650, badge: "⭐" },
];

// Area rankings
const areaRankings = [
  { area: "Koramangala, Bengaluru", score: 92, grade: "A+", color: "#22c55e" },
  { area: "Bandra, Mumbai", score: 88, grade: "A", color: "#22c55e" },
  { area: "Andheri West", score: 78, grade: "B+", color: "#eab308" },
  { area: "Connaught Place, Delhi", score: 58, grade: "C+", color: "#f97316" },
  { area: "Patparganj, Delhi", score: 42, grade: "D", color: "#ef4444" },
];

function CleanAirChallenge() {
  const [myPoints, setMyPoints] = useState(1250);
  const [myCo2, setMyCo2] = useState(24.5);
  const [completedToday, setCompletedToday] = useState([]);
  const [flash, setFlash] = useState(null);

  const handleAction = (action) => {
    if (completedToday.includes(action.id)) return;
    setCompletedToday([...completedToday, action.id]);
    setMyPoints((prev) => prev + action.points);
    setMyCo2((prev) => prev + action.co2);
    setFlash(action);
    setTimeout(() => setFlash(null), 2000);
  };

  // Determine user level
  const getLevel = (pts) => {
    if (pts >= 5000) return { name: "Air Guardian", icon: "🌍", color: "#22c55e" };
    if (pts >= 2000) return { name: "Eco Champion", icon: "🏆", color: "#3b82f6" };
    if (pts >= 1000) return { name: "Green Warrior", icon: "⚡", color: "#a855f7" };
    return { name: "Starter", icon: "🌱", color: "#eab308" };
  };

  const level = getLevel(myPoints);
  const nextLevel = 2000;
  const progress = Math.min(100, (myPoints / nextLevel) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Flash notification */}
      {flash && (
        <div className="fixed top-6 right-6 z-50 glass-card px-5 py-3 flex items-center gap-3 fade-in-up"
          style={{ border: "1px solid rgba(34,197,94,0.5)" }}>
          <span className="text-xl">{flash.icon}</span>
          <div>
            <p className="text-green-400 font-bold">+{flash.points} Points!</p>
            <p className="text-gray-400 text-xs">{flash.label}</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display font-bold text-2xl text-white">Clean Air Challenge</h1>
        <p className="text-gray-400 text-sm">Earn points by taking actions that improve air quality</p>
      </div>

      {/* My Profile Card */}
      <div className="glass-card p-6" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.08))", borderColor: `${level.color}40` }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: `${level.color}20`, border: `2px solid ${level.color}40` }}>
              {level.icon}
            </div>
            <div>
              <p className="text-gray-400 text-sm">Your Level</p>
              <p className="font-display font-bold text-2xl" style={{ color: level.color }}>{level.name}</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="font-display font-black text-3xl text-white">{myPoints.toLocaleString()}</p>
              <p className="text-gray-400 text-xs">Total Points</p>
            </div>
            <div className="text-center">
              <p className="font-display font-black text-3xl text-green-400">{myCo2.toFixed(1)}kg</p>
              <p className="text-gray-400 text-xs">CO₂ Saved</p>
            </div>
          </div>
        </div>

        {/* Progress bar to next level */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress to Eco Champion</span>
            <span>{myPoints} / {nextLevel} pts</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${level.color}, #3b82f6)` }} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <FiZap className="text-yellow-400" /> Today's Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => {
            const done = completedToday.includes(action.id);
            return (
              <button key={action.id} onClick={() => handleAction(action)}
                className="glass-card p-4 text-center transition-all duration-200 hover:scale-105 relative"
                style={{
                  opacity: done ? 0.7 : 1,
                  borderColor: done ? "#22c55e40" : "rgba(59,130,246,0.15)",
                  background: done ? "rgba(34,197,94,0.08)" : undefined,
                  cursor: done ? "default" : "pointer",
                }}>
                {done && (
                  <div className="absolute top-2 right-2">
                    <FiCheckCircle className="text-green-400 text-xs" />
                  </div>
                )}
                <span className="text-3xl block mb-2">{action.icon}</span>
                <p className="text-white text-xs font-semibold mb-1">{action.label}</p>
                <p className="text-yellow-400 font-bold text-sm">+{action.points} pts</p>
                {action.co2 > 0 && (
                  <p className="text-green-400 text-xs">{action.co2}kg CO₂</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard + Area rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal leaderboard */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FiAward className="text-yellow-400" /> Top Contributors
          </h3>
          <div className="space-y-3">
            {leaderboard.map((person) => (
              <div key={person.rank} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className="text-xl w-8 text-center">{person.badge}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{person.name}</p>
                  <p className="text-gray-500 text-xs">{person.area}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold font-mono">{person.points.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area pollution score */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-green-400" /> Area Clean Air Score
          </h3>
          <div className="space-y-3">
            {areaRankings.map((area, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white text-sm">{area.area}</p>
                  <span className="font-bold font-mono px-2 py-0.5 rounded-lg text-sm"
                    style={{ background: `${area.color}20`, color: area.color }}>
                    {area.grade}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${area.score}%`, background: area.color }} />
                </div>
                <p className="text-gray-500 text-xs mt-1">{area.score}/100</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CleanAirChallenge;
