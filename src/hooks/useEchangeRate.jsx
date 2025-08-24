import { useState, useEffect } from 'react';

export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar si tenemos datos en caché y si son recientes (menos de 1 hora)
        const cachedData = localStorage.getItem('usd_ars_rate');
        const cachedTimestamp = localStorage.getItem('usd_ars_rate_timestamp');
        
        if (cachedData && cachedTimestamp) {
          const oneHour = 60 * 60 * 1000; // 1 hora en milisegundos
          const now = Date.now();
          
          if (now - parseInt(cachedTimestamp) < oneHour) {
            const parsedData = JSON.parse(cachedData);
            setExchangeRate(parsedData.rate);
            setLastUpdated(new Date(parsedData.lastUpdated));
            setLoading(false);
            return;
          }
        }

        // Hacer petición a la API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const arsRate = data.rates.ARS;
        
        if (!arsRate) {
          throw new Error('No se pudo obtener el tipo de cambio ARS');
        }

        // Guardar en caché
        const cacheData = {
          rate: arsRate,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('usd_ars_rate', JSON.stringify(cacheData));
        localStorage.setItem('usd_ars_rate_timestamp', Date.now().toString());
        
        setExchangeRate(arsRate);
        setLastUpdated(new Date(cacheData.lastUpdated));
        
      } catch (err) {
        console.error('Error fetching exchange rate:', err);
        setError(err.message);
        
        // En caso de error, usar un valor por defecto basado en datos recientes
        // Según los datos encontrados, el promedio en 2024 es alrededor de 915 ARS por USD
        setExchangeRate(1280); // Valor de fallback actualizado
        setLastUpdated(new Date());
        
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRate();
  }, []);

  // Función para forzar actualización
  const refreshRate = () => {
    localStorage.removeItem('usd_ars_rate');
    localStorage.removeItem('usd_ars_rate_timestamp');
    window.location.reload();
  };

  return {
    exchangeRate,
    loading,
    error,
    lastUpdated,
    refreshRate
  };
};