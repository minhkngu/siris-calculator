import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Fallback: If environment variables are missing or we want to allow .env.example to override
// This is helpful if the user only edited .env.example and didn't set them in the platform
try {
  if (fs.existsSync(path.resolve(".env.example"))) {
    const envExample = fs.readFileSync(path.resolve(".env.example"), "utf8");
    const lines = envExample.split("\n");
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) return;
      
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        const envKey = key.trim();
        // Override if process.env[envKey] is missing OR if the new value looks like a real credential
        // and the current one might be a placeholder or invalid.
        if (value && (!process.env[envKey] || value.startsWith("eyJ") || value.startsWith("https://"))) {
          process.env[envKey] = value;
        }
      }
    });
  }
} catch (e) {
  console.error("Error reading .env.example:", e);
}

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";

  const isJwt = (k: string) => k && k.startsWith("eyJ");
  
  return { url, key, isValid: !!(url && key && isJwt(key)) };
};

let { url: supabaseUrl, key: supabaseKey, isValid: isSupabaseValid } = getSupabaseConfig();

if (!isSupabaseValid) {
  console.error("Supabase credentials missing or invalid.");
  console.log(`URL: ${supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'MISSING'}`);
  console.log(`Key: ${supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'MISSING'}`);
} else {
  console.log(`Supabase initialized with URL: ${supabaseUrl.substring(0, 20)}...`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper for Supabase responses
  const handleSupabaseResponse = (res: express.Response, { data, error }: any) => {
    if (error) {
      console.error("Supabase error:", error);
      let errorMessage = error.message || "Unknown Supabase error";
      
      if (errorMessage.includes("Invalid API key")) {
        errorMessage = "Invalid Supabase API key. Please check your SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.";
      }

      return res.status(500).json({ 
        error: errorMessage, 
        hint: error.hint, 
        details: error.details,
        code: error.code
      });
    }
    res.json(data);
  };

  // API Routes
  app.get("/api/branches", async (req, res) => {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }
    const result = await supabase.from("branches").select("*");
    handleSupabaseResponse(res, result);
  });

  app.get("/api/room-types", async (req, res) => {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }
    const { data, error } = await supabase.from("room_types").select("*");
    if (error) return handleSupabaseResponse(res, { error });
    
    // Map snake_case to camelCase with more robust checks
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
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }
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
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
