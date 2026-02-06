const API_BASE_URL = 'http://localhost:3000/api';

export const getUsuarios = async () => {
  const response = await fetch(`${API_BASE_URL}/usuarios`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al obtener usuarios');
  }

  const data = await response.json();
  return data.data;
};
