import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useEmpleado() {
    const { user } = useAuth()
    const [empleado, setEmpleado] = useState(null)

    useEffect(() => {
        if (!user) return

        async function fetchEmpleado() {
            const { data } = await supabase
                .from('empleados')
                .select(` *, roles(nombre), empleados_sucursales(sucursales(id, nombre))`)
                .eq('auth_id', user.id)
                .single()

            if (data) setEmpleado(data)
        }

        fetchEmpleado()
    }, [user])

    return { empleado }
}