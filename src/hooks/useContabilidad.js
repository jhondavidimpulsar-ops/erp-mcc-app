import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useContabilidad() {
    const [asientos, setAsientos] = useState([])
    const [cuentas, setCuentas] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [loading, setLoading] = useState(true)

    const [filtros, setFiltros] = useState({
        fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30))
            .toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        sucursalId: '',
    })

    useEffect(() => {
        fetchCuentas()
        fetchSucursales()
    }, [])

    useEffect(() => {
        fetchAsientos()
    }, [filtros])

    async function fetchSucursales() {
        const { data } = await supabase.from('sucursales').select('id, nombre, moneda, simbolo')
        if (data) setSucursales(data)
    }

    async function fetchCuentas() {
        const { data } = await supabase
            .from('plan_cuentas')
            .select('*')
            .order('codigo')
        if (data) setCuentas(data)
    }

    async function fetchAsientos() {
        setLoading(true)

        let query = supabase
            .from('asientos')
            .select(`
        *,
        sucursales(id, nombre, moneda, simbolo),
        asientos_detalle(
          debe,
          haber,
          plan_cuentas(codigo, nombre, tipo)
        )
      `)
            .gte('created_at', filtros.fechaInicio)
            .lte('created_at', filtros.fechaFin + 'T23:59:59')
            .order('created_at', { ascending: false })

        if (filtros.sucursalId) {
            query = query.eq('sucursales_id', filtros.sucursalId)
        }

        const { data, error } = await query
        if (!error) setAsientos(data)
        setLoading(false)
    }

    const balanceGeneral = {
        activos: cuentas
            .filter(c => c.tipo === 'activo')
            .map(c => ({
                ...c,
                saldo: asientos.flatMap(a => a.asientos_detalle)
                    .filter(d => d.plan_cuentas?.codigo === c.codigo)
                    .reduce((acc, d) => acc + Number(d.debe) - Number(d.haber), 0)
            })),
        pasivos: cuentas
            .filter(c => c.tipo === 'pasivo')
            .map(c => ({
                ...c,
                saldo: asientos.flatMap(a => a.asientos_detalle)
                    .filter(d => d.plan_cuentas?.codigo === c.codigo)
                    .reduce((acc, d) => acc + Number(d.haber) - Number(d.debe), 0)
            })),
        patrimonio: cuentas
            .filter(c => c.tipo === 'patrimonio')
            .map(c => ({
                ...c,
                saldo: asientos.flatMap(a => a.asientos_detalle)
                    .filter(d => d.plan_cuentas?.codigo === c.codigo)
                    .reduce((acc, d) => acc + Number(d.haber) - Number(d.debe), 0)
            })),
    }

    const estadoResultados = {
        ingresos: cuentas
            .filter(c => c.tipo === 'ingreso')
            .map(c => ({
                ...c,
                saldo: asientos.flatMap(a => a.asientos_detalle)
                    .filter(d => d.plan_cuentas?.codigo === c.codigo)
                    .reduce((acc, d) => acc + Number(d.haber) - Number(d.debe), 0)
            })),
        gastos: cuentas
            .filter(c => c.tipo === 'gasto')
            .map(c => ({
                ...c,
                saldo: asientos.flatMap(a => a.asientos_detalle)
                    .filter(d => d.plan_cuentas?.codigo === c.codigo)
                    .reduce((acc, d) => acc + Number(d.debe) - Number(d.haber), 0)
            })),
    }

    async function registrarAsientoManual(concepto, movimientos, sucursalId) {
        const { data, error } = await supabase
            .from('asientos')
            .insert({ concepto, referencia_tipo: 'manual', sucursales_id: sucursalId || null })
            .select()
            .single()

        if (error) return { error }

        const detalle = movimientos.map(m => ({
            asiento_id: data.id,
            cuenta_id: m.cuenta_id,
            debe: m.tipo === 'debe' ? Number(m.monto) : 0,
            haber: m.tipo === 'haber' ? Number(m.monto) : 0,
        }))

        const { error: errorDetalle } = await supabase
            .from('asientos_detalle')
            .insert(detalle)

        if (!errorDetalle) fetchAsientos()
        return { error: errorDetalle }
    }

    return {
        asientos,
        cuentas,
        sucursales,
        balanceGeneral,
        estadoResultados,
        loading,
        filtros,
        setFiltros,
        registrarAsientoManual,
    }
}