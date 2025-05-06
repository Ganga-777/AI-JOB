import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch user's resume and skills
    const { data: resume } = await supabaseClient
      .from('resumes')
      .select('parsed_content, skills')
      .eq('user_id', userId)
      .single()

    const { data: skills } = await supabaseClient
      .from('skill_assessments')
      .select('skill_name, score')
      .eq('user_id', userId)

    const systemPrompt = `You are an expert interviewer and career coach. 
    Analyze the candidate's resume and skills to provide detailed, constructive feedback.
    Focus on their strengths and areas for improvement based on their experience and skill assessments.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Resume: ${resume?.parsed_content || 'No resume available'}
                     Skills: ${JSON.stringify(skills || [])}
                     Please provide interview feedback and tips.`
          }
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`)
    }

    const data = await response.json()
    const feedback = data.choices[0].message.content

    return new Response(
      JSON.stringify({ text: feedback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-feedback function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})