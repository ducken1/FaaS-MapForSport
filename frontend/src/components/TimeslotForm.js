import React, { useState } from 'react';

const TimeslotForm = ({ facilityId, facilityName, session, onTimeslotAdded, onCancel, setMessage }) => {
  const [timeslot, setTimeslot] = useState({
    date: '',
    start_time: '',
    end_time: ''
  });
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

  const handleAddTimeslot = async () => {
    if (!timeslot.date || !timeslot.start_time || !timeslot.end_time) {
      setMessage('All timeslot fields are required');
      return;
    }

    const token = session?.access_token;
    if (!token) {
      setMessage('Not authenticated');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/add-timeslot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          facility_id: facilityId,
          ...timeslot
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || 'Something went wrong');
      } else {
        onTimeslotAdded();
      }
    } catch (error) {
      setMessage('Error adding timeslot: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Add Timeslot to {facilityName}</h3>
      
      <div style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Date</label>
          <input
            type="date"
            value={timeslot.date}
            min={getTodayDate()}
            onChange={e => setTimeslot({ ...timeslot, date: e.target.value })}
            style={styles.input}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Start Time</label>
          <input
            type="time"
            value={timeslot.start_time}
            onChange={e => setTimeslot({ ...timeslot, start_time: e.target.value })}
            style={styles.input}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>End Time</label>
          <input
            type="time"
            value={timeslot.end_time}
            onChange={e => setTimeslot({ ...timeslot, end_time: e.target.value })}
            style={styles.input}
          />
        </div>
        
        <div style={styles.buttonGroup}>
          <button 
            onClick={handleAddTimeslot}
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading ? 'Adding...' : 'Save Timeslot'}
          </button>
          
          <button 
            onClick={onCancel}
            style={styles.secondaryButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fc',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#2c3e50',
    margin: '0 0 1.5rem 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#555'
  },
  input: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s ease',
    outline: 'none'
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'background-color 0.2s ease',
    minWidth: '120px'
  },
  secondaryButton: {
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#f9fafb',
    color: '#555',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    minWidth: '120px'
  }
};

export default TimeslotForm;