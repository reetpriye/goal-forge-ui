
import Dashboard from './components/Dashboard';
import AccentSwitcher from './components/AccentSwitcher';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useEffect, useState } from 'react';
import { pingBackend } from './services/ping';

function App () {
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    // Initial ping loop every 5 seconds until ready
    const initialPingLoop = async () => {
      let ready = false;
      while (!cancelled && !ready) {
        ready = await pingBackend();
        setServerReady(ready);
        if (!ready) await new Promise(res => setTimeout(res, 5000));
      }
      
      // Once ready, start the maintenance ping loop (every 14 minutes)
      if (!cancelled && ready) {
        maintenancePingLoop();
      }
    };
    
    // Maintenance ping loop every 14 minutes to keep server alive
    const maintenancePingLoop = async () => {
      while (!cancelled) {
        await new Promise(res => setTimeout(res, 14 * 60 * 1000)); // 14 minutes
        if (!cancelled) {
          const ready = await pingBackend();
          setServerReady(ready);
          // If server goes down, restart the initial ping loop
          if (!ready) {
            initialPingLoop();
            break;
          }
        }
      }
    };
    
    initialPingLoop();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Dashboard serverReady={serverReady} />
      <AccentSwitcher />
      <PWAInstallPrompt />
    </>
  );
}

export default App;
