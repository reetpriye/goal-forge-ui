
import Dashboard from './components/Dashboard';
import AccentSwitcher from './components/AccentSwitcher';
import { useEffect, useState } from 'react';
import { pingBackend } from './ping';

function App () {
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Ping backend every 5 seconds until ready
    const pingLoop = async () => {
      let ready = false;
      while (!cancelled && !ready) {
        ready = await pingBackend();
        setServerReady(ready);
        if (!ready) await new Promise(res => setTimeout(res, 5000));
      }
    };
    pingLoop();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Dashboard serverReady={serverReady} />
      <AccentSwitcher />
    </>
  );
}

export default App;
