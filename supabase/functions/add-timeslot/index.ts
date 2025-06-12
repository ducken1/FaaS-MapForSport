import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await req.json();
    const { facility_id, date, start_time, end_time } = body;

    // Validate required fields
    if (!facility_id || !date || !start_time || !end_time) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: facility_id, date, start_time, end_time" 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify that the facility belongs to the authenticated user
    const { data: facility, error: facilityError } = await supabase
      .from("facilities")
      .select("id, user_id")
      .eq("id", facility_id)
      .eq("user_id", user.id)
      .single();

    if (facilityError || !facility) {
      return new Response(
        JSON.stringify({ error: "Facility not found or access denied" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Validate time format and logic
    const startTime = new Date(`1970-01-01T${start_time}`);
    const endTime = new Date(`1970-01-01T${end_time}`);
    
    if (startTime >= endTime) {
      return new Response(
        JSON.stringify({ error: "Start time must be before end time" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for overlapping timeslots on the same date and facility
    const { data: overlapping, error: overlapError } = await supabase
      .from("timeslots")
      .select("id")
      .eq("facility_id", facility_id)
      .eq("date", date)
      .or(`start_time.lte.${end_time},end_time.gte.${start_time}`);

    if (overlapError) {
      return new Response(
        JSON.stringify({ error: "Error checking for overlapping timeslots" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (overlapping && overlapping.length > 0) {
      return new Response(
        JSON.stringify({ error: "Timeslot overlaps with existing timeslot" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Insert timeslot into database
    const { data, error } = await supabase
      .from("timeslots")
      .insert([{
        facility_id,
        date,
        start_time,
        end_time,
        is_reserved: false
      }])
      .select(`
        *,
        facilities(name)
      `);

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
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