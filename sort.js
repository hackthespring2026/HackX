import { allDeals, renderDeals } from "./script.js";

const sortSelect = document.getElementById("sort-select");

sortSelect.addEventListener("change", () => {
  let sorted = [...allDeals];

  if (sortSelect.value === "priceLow") {
    sorted.sort((a, b) => a.bestPrice - b.bestPrice);
  } else if (sortSelect.value === "priceHigh") {
    sorted.sort((a, b) => b.bestPrice - a.bestPrice);
  } else if (sortSelect.value === "expiry") {
    sorted.sort((a, b) => (a.data.minutes || 0) - (b.data.minutes || 0));
  } else if (sortSelect.value === "name") {
    sorted.sort((a, b) => (a.data.name || "").localeCompare(b.data.name || ""));
  }

  renderDeals(sorted);
});
