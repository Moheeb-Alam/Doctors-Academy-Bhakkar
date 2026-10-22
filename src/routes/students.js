import { Router } from "express";
import { requiredText, optionalText, positiveNumber } from "../utils/validation.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 100);
    let query = req.supabase.from("students")
      .select("id,student_code,full_name,father_name,phone,monthly_fee,status,enrolled_on,class_id,section_id,classes(name),sections(name)")
      .order("created_at", { ascending: false });
    if (q) query = query.or(`full_name.ilike.%${q.replace(/[,%()]/g, "")}%,student_code.ilike.%${q.replace(/[,%()]/g, "")}%,father_name.ilike.%${q.replace(/[,%()]/g, "")}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = {
      student_code: requiredText(req.body.student_code, "Student ID", 40),
      full_name: requiredText(req.body.full_name, "Student name", 120),
      father_name: requiredText(req.body.father_name, "Father name", 120),
      phone: optionalText(req.body.phone, 30),
      monthly_fee: positiveNumber(req.body.monthly_fee, "Monthly fee", true),
      class_id: req.body.class_id || null,
      section_id: req.body.section_id || null,
      status: ["active", "inactive"].includes(req.body.status) ? req.body.status : "active",
      enrolled_on: req.body.enrolled_on || new Date().toISOString().slice(0, 10)
    };
    const { data, error } = await req.supabase.from("students").insert(payload).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const payload = {
      student_code: requiredText(req.body.student_code, "Student ID", 40),
      full_name: requiredText(req.body.full_name, "Student name", 120),
      father_name: requiredText(req.body.father_name, "Father name", 120),
      phone: optionalText(req.body.phone, 30),
      monthly_fee: positiveNumber(req.body.monthly_fee, "Monthly fee", true),
      class_id: req.body.class_id || null,
      section_id: req.body.section_id || null,
      status: ["active", "inactive"].includes(req.body.status) ? req.body.status : "active",
      enrolled_on: req.body.enrolled_on || new Date().toISOString().slice(0, 10)
    };
    const { data, error } = await req.supabase.from("students").update(payload).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await req.supabase.from("students").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (e) { next(e); }
});
export default router;
