// Simple endpoint to check backend readiness
import api from './api';

export async function pingBackend() {
  try {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Pinging backend...`);
    const res = await api.get('/ping', { timeout: 3000 });
    const success = res.status === 200;
    console.log(`[${timestamp}] Backend ping ${success ? 'successful' : 'failed'} - Status: ${res.status}`);
    return success;
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Backend ping failed - Error:`, error);
    return false;
  }
}
