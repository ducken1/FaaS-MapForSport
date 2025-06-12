import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS headers helper - Updated to include x-client-info
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Consider restricting to http://localhost:3000 in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey", // Added x-client-info and apikey
  "Content-Type": "application/json"
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization") ?? ""
    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { 
          status: 401,
          headers: corsHeaders 
        }
      )
    }

// Parse request body
const body = await req.json();
const { name, description, image_filename } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ error: "Missing name field" }), 
        { 
          status: 400,
          headers: corsHeaders 
        }
      )
    }

    // Insert facility into database
    const { data, error } = await supabase
      .from("facilities")
      .insert([{ name, description, image_filename, user_id: user.id }])
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          status: 400,
          headers: corsHeaders 
        }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({ success: true, data }), 
      {
        status: 200,
        headers: corsHeaders,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }), 
      { 
        status: 500,
        headers: corsHeaders 
      }
    )
  }
})