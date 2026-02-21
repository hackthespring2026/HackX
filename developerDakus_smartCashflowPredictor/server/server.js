const express = require("express");
const cors = require("cors");
const financeRoutes = require("./routes/financeRoutes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/finance", financeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Smart Cash Flow Predictor API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
