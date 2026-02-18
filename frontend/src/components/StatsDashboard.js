import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';

function StatsDashboard({ refreshToken }) {
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    avg_tickets_per_day: 0,
    priority_breakdown: {},
    category_breakdown: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function fetchStats() {
      setIsLoading(true);
      try {
        const response = await api.get('/tickets/stats/');
        if (isActive) {
          setStats(response.data);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      isActive = false;
    };
  }, [refreshToken]);

  const formattedAvg = useMemo(
    () => Number(stats.avg_tickets_per_day || 0).toLocaleString(undefined, { maximumFractionDigits: 2 }),
    [stats.avg_tickets_per_day]
  );

  return (
    <section className="panel">
      <h2>Stats</h2>

      {isLoading && <div className="spinner">Loading stats...</div>}

      {!isLoading && (
        <>
          <div className="stats-grid">
            <div>
              <strong>Total Tickets:</strong> {Number(stats.total_tickets || 0).toLocaleString()}
            </div>
            <div>
              <strong>Open Tickets:</strong> {Number(stats.open_tickets || 0).toLocaleString()}
            </div>
            <div>
              <strong>Average/Day:</strong> {formattedAvg}
            </div>
          </div>

          <div className="breakdowns">
            <div>
              <h3>Priority Breakdown</h3>
              <ul>
                {Object.entries(stats.priority_breakdown).map(([key, value]) => (
                  <li key={key}>
                    {key}: {Number(value).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Category Breakdown</h3>
              <ul>
                {Object.entries(stats.category_breakdown).map(([key, value]) => (
                  <li key={key}>
                    {key}: {Number(value).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default StatsDashboard;
