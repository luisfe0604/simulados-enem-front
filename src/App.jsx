import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Simulado from "./pages/Simulado";
import Historico from "./pages/Historico";
import Login from "./pages/Login";
import AuthSuccess from "./pages/AuthSuccess";
import PrivateRoute from "./components/ProtectedRoutes";
import Register from "./pages/Register";
import Conta from "./pages/Conta";
import NewQuestion from "./pages/NewQuestion";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth-success" element={<AuthSuccess />} />

      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/simulado"
          element={
            <PrivateRoute>
              <Simulado />
            </PrivateRoute>
          }
        />
        <Route
          path="/historico"
          element={
            <PrivateRoute>
              <Historico />
            </PrivateRoute>
          }
        />
        <Route
          path="/simulado/refazer/:id"
          element={
            <PrivateRoute>
              <Simulado />
            </PrivateRoute>
          }
        />
        <Route
          path="/conta"
          element={
            <PrivateRoute>
              <Conta />
            </PrivateRoute>
          }
        />
        <Route
          path="/questao"
          element={
            <PrivateRoute>
              <AdminRoute>
                <NewQuestion />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashAdmin"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}
