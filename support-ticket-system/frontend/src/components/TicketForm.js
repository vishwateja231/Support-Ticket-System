import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import useDebouncedValue from '../hooks/useDebouncedValue';

const categoryOptions = ['billing', 'technical', 'account', 'general'];
const priorityOptions = ['low', 'medium', 'high', 'critical'];

function TicketForm({ onTicketCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const debouncedDescription = useDebouncedValue(description, 600);

  useEffect(() => {
    if (!debouncedDescription.trim()) {
      return;
    }

    let isActive = true;

    async function classifyDescription() {
      setIsClassifying(true);
      try {
        const response = await api.post('/tickets/classify/', { description: debouncedDescription });
        if (!isActive) {
          return;
        }
        if (response.data?.suggested_category) {
          setCategory(response.data.suggested_category);
        }
        if (response.data?.suggested_priority) {
          setPriority(response.data.suggested_priority);
        }
      } catch (error) {
        // Gracefully ignore classification failures to keep form usable.
      } finally {
        if (isActive) {
          setIsClassifying(false);
        }
      }
    }

    classifyDescription();

    return () => {
      isActive = false;
    };
  }, [debouncedDescription]);

  useEffect(() => {
    if (!submitSuccess) {
      return;
    }
    const timeoutId = setTimeout(() => setSubmitSuccess(''), 2500);
    return () => clearTimeout(timeoutId);
  }, [submitSuccess]);

  const isSubmitDisabled = useMemo(
    () => isSubmitting || !title.trim() || !description.trim(),
    [isSubmitting, title, description]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      await api.post('/tickets/', {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
      setSubmitSuccess('Ticket created successfully.');
      onTicketCreated();
    } catch (error) {
      setSubmitError('Unable to submit ticket right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h2>Create Ticket</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
          />
        </label>

        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} required />
          <small className="muted">{description.length} characters</small>
        </label>

        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>

        {isClassifying && <p className="info">Classifying description...</p>}
        {submitError && <p className="error-message">{submitError}</p>}
        {submitSuccess && <p className="success-message">{submitSuccess}</p>}
      </form>
    </section>
  );
}

export default TicketForm;
