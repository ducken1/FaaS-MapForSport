import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json"
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    const authHeader = req.headers.get("Authorization") ?? ""
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const { timeslot_id } = await req.json()
    if (!timeslot_id) {
      return new Response(
        JSON.stringify({ error: 'Timeslot ID is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Check reservation exists and belongs to user
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('timeslot_id', timeslot_id)
      .eq('user_id', user.id)
      .single()

    if (reservationError || !reservation) {
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Delete reservation
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservation.id)

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to cancel reservation' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Update timeslot to be available
    const { error: updateError } = await supabase
      .from('timeslots')
      .update({ is_reserved: false })
      .eq('id', timeslot_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update timeslot' }),
        { status: 500, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Reservation cancelled successfully' }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
