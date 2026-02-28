export function formatMoneda(monto, moneda = 'USD', simbolo = '$') {
    if (moneda === 'COP') {
        return `${simbolo} ${new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(monto)}`
    }

    return `${simbolo} ${new Intl.NumberFormat('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(monto)}`
}
