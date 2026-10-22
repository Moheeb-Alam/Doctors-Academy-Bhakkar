import { createUserClient } from "../config/supabase.js";

export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Please sign in to continue." });

    const supabase = createUserClient(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role, full_name").eq("id", authData.user.id).maybeSingle();

    if (profileError) return res.status(403).json({ error: "Unable to verify your admin role. Check database setup." });
    if (!profile || profile.role !== "admin") return res.status(403).json({ error: "Admin access is required." });

    req.supabase = supabase;
    req.user = authData.user;
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
}
