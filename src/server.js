import "dotenv/config";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAdmin } from "./middleware/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import classRoutes from "./routes/classes.js";
import studentRoutes from "./routes/students.js";
import feeRoutes from "./routes/fees.js";
import expenseRoutes from "./routes/expenses.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "100kb" }));
app.use(express.static(publicDir));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", requireAdmin);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/expenses", expenseRoutes);

app.get("*splat", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint not found." });
  res.sendFile(path.join(publicDir, "index.html"), error => error && next(error));
});

app.use((err, _req, res, _next) => {
  console.error("Request error:", err.message);
  const status = err.status || (err.code === "23505" ? 409 : err.code === "23503" ? 400 : 400);
  let message = err.message || "Something went wrong.";
  if (err.code === "23505") message = "This record already exists. Check for a duplicate ID or name.";
  if (err.code === "23503") message = "This record is linked to another record and cannot be changed or deleted.";
  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Doctors Academy portal running at http://localhost:${port}`));
