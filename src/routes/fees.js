import { Router } from "express";
import { positiveNumber, requiredText, optionalText, dateValue } from "../utils/validation.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await req.supabase.from("fee_payments")
      .select("id,student_id,amount,paid_on,period,method,reference,note,created_at,students(student_code,full_name,father_name,monthly_fee,classes(name),sections(name))")
      .order("paid_on", { ascending: false }).limit(500);
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const student_id = requiredText(String(req.body.student_id || ""), "Student", 80);
    const amount = positiveNumber(req.body.amount, "Payment amount");
    const paid_on = dateValue(req.body.paid_on, "Payment date");
    const period = requiredText(req.body.period, "Fee period", 20);
    const method = ["cash", "bank", "online", "other"].includes(req.body.method) ? req.body.method : "cash";
    const reference = optionalText(req.body.reference, 80);
    const note = optionalText(req.body.note, 250);
    const { data, error } = await req.supabase.from("fee_payments")
      .insert({ student_id, amount, paid_on, period, method, reference, note }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await req.supabase.from("fee_payments").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (e) { next(e); }
});
export default router;
