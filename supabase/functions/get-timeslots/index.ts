import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Get auth header and extract token
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing authorization token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication (but don't check facility ownership)
    const { error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Get URL parameters
    const url = new URL(req.url);
    const facilityId = url.searchParams.get("facility_id");
    const date = url.searchParams.get("date");

    // Build query for timeslots (removed the facility ownership check)
let query = supabase
  .from("timeslots")
  .select(`
    *,
    facilities(name),
    reservations (
      user_id
    )
  `)
  .order("date", { ascending: true })
  .order("start_time", { ascending: true });

    // Add filters if provided
    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }
    
    if (date) {
      query = query.eq("date", date);
    }

    const { data: timeslots, error } = await query;

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: timeslots || [] }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Catch error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});