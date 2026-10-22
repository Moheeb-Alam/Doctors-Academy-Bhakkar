import { Router } from "express";
import { requiredText, optionalText } from "../utils/validation.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await req.supabase.from("classes")
      .select("id,name,description,created_at,sections(id,name)").order("name");
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const name = requiredText(req.body.name, "Class name", 80);
    const description = optionalText(req.body.description, 250);
    const { data, error } = await req.supabase.from("classes").insert({ name, description }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const name = requiredText(req.body.name, "Class name", 80);
    const description = optionalText(req.body.description, 250);
    const { data, error } = await req.supabase.from("classes").update({ name, description })
      .eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { error } = await req.supabase.from("classes").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (e) { next(e); }
});

router.post("/:id/sections", async (req, res, next) => {
  try {
    const name = requiredText(req.body.name, "Section name", 80);
    const { data, error } = await req.supabase.from("sections")
      .insert({ class_id: req.params.id, name }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.put("/sections/:sectionId", async (req, res, next) => {
  try {
    const name = requiredText(req.body.name, "Section name", 80);
    const { data, error } = await req.supabase.from("sections").update({ name })
      .eq("id", req.params.sectionId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.delete("/sections/:sectionId", async (req, res, next) => {
  try {
    const { error } = await req.supabase.from("sections").delete().eq("id", req.params.sectionId);
    if (error) throw error;
    res.status(204).end();
  } catch (e) { next(e); }
});
export default router;
