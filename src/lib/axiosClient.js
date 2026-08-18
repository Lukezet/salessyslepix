import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const sendTenantHeader = String(import.meta.env.VITE_SEND_TENANT_HEADER) === "true";

export const axiosClient = axios.create({
  baseURL,
  timeout: 30000,
});

// Interceptor de requests
axiosClient.interceptors.request.use((config) => {
  if (sendTenantHeader) {
    const empId = Number(import.meta.env.VITE_DEFAULT_EMPRESA_ID) || 1;
    config.headers["X-Empresa-Id"] = empId;
  }
  return config;
});

// Interceptor de responses - NUEVO
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          errorMessage = data.message || 'Email o contraseña incorrectos';
          break;
        case 400:
          errorMessage = data.message || 'Los datos proporcionados no son válidos';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'El recurso solicitado no fue encontrado';
          break;
        case 422:
          errorMessage = data.message || 'Error de validación';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta nuevamente.';
          break;
        default:
          errorMessage = data.message || `Error del servidor (${status})`;
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      errorMessage = 'La solicitud tardó demasiado. Intenta nuevamente.';
    }
    
    // Crear un nuevo error con mensaje amigable
    // Conserva la forma de Axios para que las pantallas puedan tratar 404/422.
    const friendlyError = new Error(errorMessage);
    friendlyError.name = "ApiError";
    friendlyError.originalError = error;
    friendlyError.response = error.response;
    friendlyError.request = error.request;
    friendlyError.config = error.config;
    friendlyError.statusCode = error.response?.status;
    
    return Promise.reject(friendlyError);
  }
);
