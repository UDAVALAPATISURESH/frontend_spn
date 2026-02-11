import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL,
});

export const authApi = () => {
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

  return axios.create({
    baseURL,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });
};

