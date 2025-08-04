// Simple endpoint to check backend readiness
import api from './api';

export async function pingBackend() {
  try {
    const res = await api.get('/ping');
    return res.status === 200;
  } catch {
    return false;
  }
}
