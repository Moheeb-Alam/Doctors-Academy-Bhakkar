import { Router } from "express";
import { positiveNumber, requiredText, optionalText, dateValue } from "../utils/validation.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await req.supabase.from("expenses").select("*").order("spent_on", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});
router.post("/", async (req, res, next) => {
  try {
    const payload = {
      title: requiredText(req.body.title, "Expense title", 120),
      category: requiredText(req.body.category, "Category", 80),
      amount: positiveNumber(req.body.amount, "Amount"),
      spent_on: dateValue(req.body.spent_on, "Expense date"),
      note: optionalText(req.body.note, 250)
    };
    const { data, error } = await req.supabase.from("expenses").insert(payload).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});
router.put("/:id", async (req, res, next) => {
  try {
    const payload = {
      title: requiredText(req.body.title, "Expense title", 120),
      category: requiredText(req.body.category, "Category", 80),
      amount: positiveNumber(req.body.amount, "Amount"),
      spent_on: dateValue(req.body.spent_on, "Expense date"),
      note: optionalText(req.body.note, 250)
    };
    const { data, error } = await req.supabase.from("expenses").update(payload).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await req.supabase.from("expenses").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (e) { next(e); }
});
export default router;
