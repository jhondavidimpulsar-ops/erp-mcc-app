import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useEmpleados() {
    const [empleados, setEmpleados] = useState([])
    const [roles, setRoles] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEmpleados()
        fetchRoles()
        fetchSucursales()
    }, [])

    async function fetchEmpleados() {
        const { data, error } = await supabase
            .from('empleados')
            .select(`
        *,
        roles(nombre),
        empleados_sucursales(
          sucursales(id, nombre)
        )
      `)
            .order('created_at', { ascending: false })

        if (!error) setEmpleados(data)
        setLoading(false)
    }

    async function fetchRoles() {
        const { data } = await supabase.from('roles').select('*')
        if (data) setRoles(data)
    }

    async function fetchSucursales() {
        const { data } = await supabase.from('sucursales').select('*')
        if (data) setSucursales(data)
    }

    async function crearEmpleado(datos) {
        const { data, error } = await supabase.functions.invoke('crear-empleado', {
            body: datos
        })
        if (!error) fetchEmpleados()
        return { data, error }
    }

    async function actualizarEmpleado(id, datos) {
        const { error } = await supabase
            .from('empleados')
            .update({ nombre: datos.nombre, roles_id: datos.rol_id })
            .eq('id', id)

        if (!error) {
            await supabase.from('empleados_sucursales').delete().eq('empleados_id', id)
            const sucursales = datos.sucursal_ids.map(sid => ({
                empleados_id: id,
                sucursales_id: sid,
            }))
            await supabase.from('empleados_sucursales').insert(sucursales)
            fetchEmpleados()
        }
        return { error }
    }

    async function eliminarEmpleado(id, authId) {
        await supabase.from('empleados_sucursales').delete().eq('empleados_id', id)
        await supabase.from('empleados').delete().eq('id', id)
        fetchEmpleados()
    }

    return { empleados, roles, sucursales, loading, crearEmpleado, actualizarEmpleado, eliminarEmpleado }
}