import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  const isJwt = (k: string) => k && (k.startsWith("eyJ") || k.startsWith("sb_"));
  return { url, key, isValid: !!(url && key && isJwt(key)) };
};

const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());

// Helper for Supabase responses
const handleSupabaseResponse = (res: express.Response, { data, error }: any) => {
  if (error) {
    console.error("Supabase API Error:", error);
    return res.status(500).json({ 
      error: error.message,
      details: error.details,
      hint: error.hint
    });
  }
  res.json(data);
};

// API Routes
app.get("/api/branches", async (req, res) => {
  const result = await supabase.from("branches").select("*");
  handleSupabaseResponse(res, result);
});

app.get("/api/room-types", async (req, res) => {
  const { data, error } = await supabase.from("room_types").select("*");
  if (error) return handleSupabaseResponse(res, { error });
  
  const mapped = (data || []).map((r: any) => ({
    id: r.id,
    branchId: r.branch_id || r.branchId || r.branchid,
    name: r.name,
    weekdayPrice: r.weekday_price || r.weekdayPrice || r.weekdayprice || 0,
    weekendPrice: r.weekend_price || r.weekendPrice || r.weekendprice || 0
  }));
  res.json(mapped);
});

app.get("/api/stay-discounts", async (req, res) => {
  const { data, error } = await supabase.from("stay_discounts").select("*");
  if (error) return handleSupabaseResponse(res, { error });
  const mapped = (data || []).map((d: any) => ({
    id: d.id,
    minNights: d.min_nights || d.minNights || d.minnights || 1,
    discountAmount: d.discount_amount || d.discountAmount || d.discountamount || 0,
    isPercentage: d.is_percentage !== undefined ? d.is_percentage : (d.isPercentage !== undefined ? d.isPercentage : d.ispercentage),
    name: d.name
  }));
  res.json(mapped);
});

app.get("/api/date-adjustments", async (req, res) => {
  const { data, error } = await supabase.from("date_adjustments").select("*");
  if (error) return handleSupabaseResponse(res, { error });
  const mapped = (data || []).map((a: any) => ({
    id: a.id,
    date: a.date,
    type: a.type,
    amount: a.amount,
    isPercentage: a.is_percentage !== undefined ? a.is_percentage : (a.isPercentage !== undefined ? a.isPercentage : a.ispercentage),
    note: a.note
  }));
  res.json(mapped);
});

// Export the app for Vercel
export default app;
