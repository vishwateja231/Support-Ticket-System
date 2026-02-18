import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import useDebouncedValue from '../hooks/useDebouncedValue';

const statusOptions = ['open', 'in_progress', 'resolved', 'closed'];

function truncateDescription(text) {
  if (text.length <= 90) {
    return text;
  }
  return `${text.slice(0, 90)}...`;
}

function getPriorityBadgeClass(priority) {
  return `badge badge-${priority}`;
}

function TicketList({ refreshToken, onTicketUpdated }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    status: '',
    ordering: 'newest',
  });
  const [searchInput, setSearchInput] = useState('');

  const debouncedSearch = useDebouncedValue(searchInput, 500);

  const queryParams = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch]
  );

  useEffect(() => {
    let isActive = true;

    async function fetchTickets() {
      setIsLoading(true);
      try {
        const response = await api.get('/tickets/', { params: queryParams });
        const payload = Array.isArray(response.data) ? response.data : response.data?.results || [];
        if (isActive) {
          setTickets(payload);
        }
      } catch (error) {
        if (isActive) {
          setTickets([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchTickets();

    return () => {
      isActive = false;
    };
  }, [refreshToken, queryParams]);

  const updateStatus = async (ticket) => {
    const currentIndex = statusOptions.indexOf(ticket.status);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];
    await api.patch(`/tickets/${ticket.id}/`, { status: nextStatus });
    onTicketUpdated();
  };

  return (
    <section className="panel">
      <h2>Tickets</h2>
      <div className="filters">
        <input
          placeholder="Search title or description"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <select onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}>
          <option value="">All Categories</option>
          <option value="billing">billing</option>
          <option value="technical">technical</option>
          <option value="account">account</option>
          <option value="general">general</option>
        </select>
        <select onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}>
          <option value="">All Priorities</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <select onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
          <option value="">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={filters.ordering}
          onChange={(event) => setFilters((prev) => ({ ...prev, ordering: event.target.value }))}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {isLoading && <div className="spinner">Loading tickets...</div>}

      {!isLoading && tickets.length === 0 && <p className="muted">No tickets found.</p>}

      {!isLoading && tickets.length > 0 && (
        <ul className="ticket-list">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="ticket-item" onClick={() => updateStatus(ticket)}>
              <h3>{ticket.title}</h3>
              <p>{truncateDescription(ticket.description)}</p>
              <div className="meta">
                <span>Category: {ticket.category}</span>
                <span>
                  Priority: <strong className={getPriorityBadgeClass(ticket.priority)}>{ticket.priority}</strong>
                </span>
                <span>Status: {ticket.status}</span>
                <span>{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TicketList;
