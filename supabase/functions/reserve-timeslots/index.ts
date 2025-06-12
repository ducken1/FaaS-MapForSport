import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // In production, replace * with your frontend URL
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json"
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders } 
        }
      )
    }

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

    // Get the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders } 
        }
      )
    }

    // Parse the request body
    const { timeslot_id } = await req.json()
    if (!timeslot_id) {
      return new Response(
        JSON.stringify({ error: 'Timeslot ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders } 
        }
      )
    }

    // Check if timeslot exists and is available
    const { data: timeslot, error: timeslotError } = await supabase
      .from('timeslots')
      .select('*')
      .eq('id', timeslot_id)
      .single()

    if (timeslotError || !timeslot) {
      return new Response(
        JSON.stringify({ error: 'Timeslot not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders } 
        }
      )
    }

    if (timeslot.is_reserved) {
      return new Response(
        JSON.stringify({ error: 'Timeslot is already reserved' }),
        { 
          status: 409, 
          headers: { ...corsHeaders } 
        }
      )
    }

    // Update the timeslot and create reservation in a transaction
    const { error: updateError } = await supabase
      .from('timeslots')
      .update({ is_reserved: true })
      .eq('id', timeslot_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to reserve timeslot' }),
        { 
          status: 500, 
          headers: { ...corsHeaders } 
        }
      )
    }

    // Create the reservation record
    const { error: reservationError } = await supabase
      .from('reservations')
      .insert({
        user_id: user.id,
        timeslot_id: timeslot_id
      })

    if (reservationError) {
      // Rollback the timeslot update if reservation fails
      await supabase
        .from('timeslots')
        .update({ is_reserved: false })
        .eq('id', timeslot_id)

      return new Response(
        JSON.stringify({ error: 'Failed to create reservation' }),
        { 
          status: 500, 
          headers: { ...corsHeaders } 
        }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Timeslot reserved successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders } 
      }
    )
  }
})