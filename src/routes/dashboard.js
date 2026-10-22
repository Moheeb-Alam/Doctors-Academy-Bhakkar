import { Router } from "express";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const db = req.supabase;
    const [students, classes, sections, payments, expenses, feeStudents] = await Promise.all([
      db.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
      db.from("classes").select("id", { count: "exact", head: true }),
      db.from("sections").select("id", { count: "exact", head: true }),
      db.from("fee_payments").select("amount, paid_on"),
      db.from("expenses").select("amount, spent_on"),
      db.from("students").select("id, monthly_fee").eq("status", "active")
    ]);
    for (const result of [students, classes, sections, payments, expenses, feeStudents]) {
      if (result.error) throw result.error;
    }
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const paid = (payments.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const monthlyIncome = (payments.data || []).filter(p => String(p.paid_on).startsWith(month))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const expenseTotal = (expenses.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
    // The first version tracks a monthly fee amount per active student. Outstanding is an estimate
    // for the current month, floored at zero; payment history remains transaction-based.
    const monthlyDue = (feeStudents.data || []).reduce((sum, s) => sum + Number(s.monthly_fee || 0), 0);
    const currentMonthPaid = (payments.data || []).filter(p => String(p.paid_on).startsWith(month))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    res.json({
      totalStudents: students.count || 0, totalClasses: classes.count || 0,
      totalSections: sections.count || 0, feesCollected: paid,
      pendingFees: Math.max(0, monthlyDue - currentMonthPaid),
      expenses: expenseTotal, monthlyIncome,
      netIncome: paid - expenseTotal
    });
  } catch (error) { next(error); }
});
export default router;
