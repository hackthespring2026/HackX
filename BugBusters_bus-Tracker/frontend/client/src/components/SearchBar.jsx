import { useState, useContext } from "react";
import { BusContext } from "../context/BusContext";

const SearchBar = () => {
  const [input, setInput] = useState("");
  const { searchBus, loading } = useContext(BusContext);

  const handleSearch = () => {
    if (input.trim()) {
      searchBus(input);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-xl rounded-xl overflow-hidden border border-[#697565] bg-[#f3f5f1]">

        <input
          type="text"
          placeholder="Enter Bus Number..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="
            flex-1
            px-4 py-3
            bg-transparent
            text-[#5c4f3d]
            placeholder-[#697565]
            outline-none
            focus:ring-2
            focus:ring-[#697565]
            transition
          "
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          className="
            bg-[#655e3f]
            text-[#ECDFCC]
            px-6
            font-medium
            transition
            hover:bg-[#5f6a59]
            disabled:opacity-60
          "
        >
          {loading ? "Searching..." : "Search"}
        </button>

      </div>
    </div>
  );
};

export default SearchBar;