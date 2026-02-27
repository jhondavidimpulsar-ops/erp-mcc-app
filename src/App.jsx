import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Dashboard from './pages/erp/Dashboard'
import Productos from './pages/erp/Productos'
import Inventario from './pages/erp/Inventario'
import Clientes from './pages/erp/Clientes'
import Ventas from './pages/erp/Ventas'
import Empleados from './pages/erp/Empleados'


function ProtectedRoute({ children }) {
    const { user } = useAuth()
    return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
    const { user } = useAuth()

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
            <Route path="/empleados" element={<ProtectedRoute><Empleados /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    )
}