import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../store/auth";

export default function Login({ open, onClose }) {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    
    try {
      await login(email, password);
      onClose?.();
    } catch (error) {
      // El interceptor ya procesó el error, solo mostrar el mensaje
      console.error('Error de login:', error);
      
      // Usar el mensaje del interceptor o fallback
      const errorMessage = error.message || 'Error al iniciar sesión';
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErr("");
    setEmail("");
    setPassword("");
    onClose?.();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm supports-[backdrop-filter]:bg-black/20">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full inputRan border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full inputRan border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 inputRanBlack text-white rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-200 disabled:cursor-not-allowed active:scale-95 transition-all px-4 py-2 font-semibold"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
    , document.body
  );
}
