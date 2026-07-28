import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, framework = 'react', architecture = 'frontend' } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer le client Supabase avec le token de l'utilisateur
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Vérifier les crédits
    const { data: { user } } = await supabaseClient.auth.getUser()
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < 1) {
      return new Response(
        JSON.stringify({ error: 'Crédits insuffisants' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Appel à l'API Claude (Anthropic)
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        system: `Tu es un développeur React/TypeScript expert. Génère du code propre, typé et accessible.`,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const aiResult = await anthropicResponse.json()
    const generatedCode = aiResult.content?.[0]?.text || '// Code non généré'

    // Extraire le code des blocs markdown
    const codeMatch = generatedCode.match(/```(?:tsx?|jsx?|html)?
([\s\S]*?)```/)
    const cleanCode = codeMatch ? codeMatch[1].trim() : generatedCode

    // Sauvegarder dans la DB
    const { data: codeRecord, error } = await supabaseClient
      .from('generated_codes')
      .insert({
        user_id: user.id,
        prompt,
        code: cleanCode,
        language: framework === 'react' ? 'tsx' : framework,
        framework,
      })
      .select()
      .single()

    if (error) throw error

    // Décrémenter les crédits
    await supabaseClient
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id)

    return new Response(
      JSON.stringify({
        success: true,
        code: cleanCode,
        id: codeRecord.id,
        credits_remaining: profile.credits - 1,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})