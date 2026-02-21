import React from "react";

function Loader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      {/* Animated rings */}
      <div className="relative w-16 h-16">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "#22c55e", borderRightColor: "#3b82f6" }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: "#0ea5e9",
            borderRightColor: "#22c55e",
            animationDirection: "reverse",
            animationDuration: "0.8s",
          }}
        />
        <div
          className="absolute inset-4 rounded-full"
          style={{ background: "radial-gradient(circle, #22c55e30, transparent)" }}
        />
      </div>
      <p className="text-gray-400 text-sm animate-pulse">{text}</p>
    </div>
  );
}

export default Loader;
