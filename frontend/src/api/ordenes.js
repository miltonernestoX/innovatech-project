const API_BASE_URL = 'http://localhost:3000/api';

export const getOrdenes = async () => {
  const response = await fetch(`${API_BASE_URL}/ordenes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al obtener ordenes');
  }

  const data = await response.json();
  return data.data;
};
