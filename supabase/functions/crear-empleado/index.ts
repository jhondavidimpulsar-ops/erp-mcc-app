import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    const { nombre, correo, password, rol_id, sucursal_ids } = await req.json()

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password: password,
      email_confirm: true,
    })

    if (authError) throw authError

    const { data: empleado, error: empleadoError } = await supabaseAdmin
        .from('empleados')
        .insert({
          auth_id: authData.user.id,
          nombre,
          roles_id: rol_id,
        })
        .select()
        .single()

    if (empleadoError) throw empleadoError

    const sucursales = sucursal_ids.map((id: string) => ({
      empleados_id: empleado.id,
      sucursales_id: id,
    }))

    const { error: sucursalError } = await supabaseAdmin
        .from('empleados_sucursales')
        .insert(sucursales)

    if (sucursalError) throw sucursalError

    return new Response(
        JSON.stringify({ empleado }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})