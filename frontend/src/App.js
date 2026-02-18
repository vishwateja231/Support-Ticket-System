import React, { useCallback, useState } from 'react';
import StatsDashboard from './components/StatsDashboard';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';

function App() {
  const [refreshToken, setRefreshToken] = useState(0);

  const handleDataChanged = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  return (
    <div>
      <header className="app-header">
        <div className="container">
          <h1>Support Ticket System</h1>
        </div>
      </header>
      <main className="container">
        <StatsDashboard refreshToken={refreshToken} />
        <TicketForm onTicketCreated={handleDataChanged} />
        <TicketList refreshToken={refreshToken} onTicketUpdated={handleDataChanged} />
      </main>
    </div>
  );
}

export default App;
