import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, Trash2 } from 'lucide-react';

const TimeslotList = ({ session, facilityId = null, onTimeslotDeleted, setMessage }) => {
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

  const fetchTimeslots = async () => {
    setLoading(true);
    try {
      let url = `${supabaseUrl}/functions/v1/get-timeslots`;
      const params = new URLSearchParams();
      
      if (facilityId) {
        params.append('facility_id', facilityId);
      }
      
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        setTimeslots(result.data || []);
      } else {
        setMessage(result.error || 'Failed to fetch timeslots');
      }
    } catch (error) {
      setMessage('Error fetching timeslots: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeslots();
  }, [facilityId, selectedDate]);

  const handleReserve = async (timeslotId) => {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/reserve-timeslots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ timeslot_id: timeslotId }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to reserve timeslot');
    }

    setMessage('Timeslot reserved successfully!');
    fetchTimeslots(); // Refresh to reflect the change
  } catch (error) {
    console.error(error);
    setMessage('Error reserving timeslot: ' + error.message);
  }
};

const handleCancelReservation = async (timeslotId) => {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/cancel-reservation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ timeslot_id: timeslotId })
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || 'Failed to cancel reservation');
      return;
    }

    // ✅ Success: Show a message or toast
    setMessage('Reservation cancelled successfully!'); // <-- Add this

    // ✅ Refresh data
    fetchTimeslots();
  } catch (err) {
    alert('Unexpected error: ' + err.message);
  }
};


// Updated handleDeleteTimeslot function with better error handling
const handleDeleteTimeslot = async (timeslotId) => {
  if (!window.confirm('Are you sure you want to delete this timeslot?')) {
    return;
  }

  try {
    console.log('Deleting timeslot:', timeslotId);
    console.log('Using URL:', `${supabaseUrl}/functions/v1/delete-timeslot`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/delete-timeslot`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: timeslotId }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Delete result:', result);
    
    setMessage('Timeslot deleted successfully!');
    fetchTimeslots(); // Refresh the list
    if (onTimeslotDeleted) {
      onTimeslotDeleted();
    }

  } catch (error) {
    console.error('Delete error details:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Failed to fetch')) {
      setMessage('Network error: Could not connect to server. Please check your internet connection and try again.');
    } else if (error.message.includes('Unauthorized')) {
      setMessage('Authentication error: Please log in again and try.');
    } else if (error.message.includes('Cannot delete a reserved timeslot')) {
      setMessage('Cannot delete: This timeslot is already reserved.');
    } else if (error.message.includes('You can only delete timeslots from your own facilities')) {
      setMessage('Permission denied: You can only delete timeslots from your own facilities.');
    } else {
      setMessage('Error deleting timeslot: ' + error.message);
    }
  }
};

  const formatTime = (timeString) => {
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const groupTimeslotsByDate = (timeslots) => {
    const grouped = {};
    timeslots.forEach(timeslot => {
      const date = timeslot.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(timeslot);
    });
    return grouped;
  };

  if (loading) {
    return <div style={styles.loading}>Loading timeslots...</div>;
  }

  if (timeslots.length === 0) {
    return (
      <div style={styles.emptyState}>
        <Calendar size={32} style={styles.emptyIcon} />
        <p style={styles.emptyText}>No timeslots found</p>
        <p style={styles.emptySubtext}>
          {facilityId ? 'Add timeslots to this facility to get started!' : 'Create some facilities and add timeslots!'}
        </p>
      </div>
    );
  }

  const groupedTimeslots = groupTimeslotsByDate(timeslots);

  return (
    <div style={styles.container}>
      {/* Date Filter */}
      <div style={styles.filterSection}>
        <label style={styles.filterLabel}>Filter by date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.dateInput}
        />
        {selectedDate && (
          <button 
            onClick={() => setSelectedDate('')}
            style={styles.clearButton}
          >
            Clear
          </button>
        )}
      </div>

      {/* Timeslots by Date */}
      {Object.entries(groupedTimeslots).map(([date, dateTimeslots]) => (
        <div key={date} style={styles.dateGroup}>
          <h3 style={styles.dateHeader}>
            <Calendar size={16} />
            {formatDate(date)}
          </h3>
          
          <div style={styles.timeslotGrid}>
{dateTimeslots.map((timeslot) => {
  // Get the user_id of the reservation if it exists (assuming one reservation per timeslot)
  const reservedUserId = timeslot.reservations?.[0]?.user_id;

  // Check if the current logged-in user is the one who reserved this timeslot
  const isOwner = String(reservedUserId) === String(session.user.id);

  return (
    <div
      key={timeslot.id}
      style={{
        ...styles.timeslotCard,
        ...(timeslot.is_reserved ? styles.reservedCard : {})
      }}
    >
      <div style={styles.cardContent}>
        {!facilityId && (
          <div style={styles.facilityName}>
            <MapPin size={12} />
            <span>{timeslot.facilities?.name}</span>
          </div>
        )}
        <div style={styles.timeSection}>
          <div style={styles.timeRange}>
            <Clock size={12} />
            <span>{formatTime(timeslot.start_time)} - {formatTime(timeslot.end_time)}</span>
          </div>

          <span
            style={{
              ...styles.statusBadge,
              ...(timeslot.is_reserved ? styles.reservedBadge : styles.availableBadge)
            }}
          >
            {timeslot.is_reserved ? 'Reserved' : 'Available'}
          </span>

          {timeslot.is_reserved ? (
            isOwner ? (
              <button
                onClick={() => handleCancelReservation(timeslot.id)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            ) : (
              <span style={styles.reservedText}>Reserved</span>
            )
          ) : (
            <button
              onClick={() => handleReserve(timeslot.id)}
              style={styles.reserveButton}
            >
              Reserve
            </button>
          )}

        </div>
      </div>

      <button
        onClick={() => handleDeleteTimeslot(timeslot.id)}
        style={styles.deleteButton}
        title="Delete Timeslot"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
})}

          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  loading: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: '1.5rem',
    fontSize: '0.9rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: '#6b7280'
  },
  emptyIcon: {
    color: '#d1d5db',
    marginBottom: '0.75rem'
  },
  emptyText: {
    fontSize: '1rem',
    fontWeight: '500',
    margin: '0 0 0.25rem 0',
    color: '#374151'
  },
  emptySubtext: {
    fontSize: '0.85rem',
    margin: 0,
    color: '#9ca3af'
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '0.85rem'
  },
  filterLabel: {
    fontWeight: '500',
    color: '#374151',
    fontSize: '0.85rem'
  },
  dateInput: {
    padding: '0.25rem 0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '0.8rem',
    minWidth: '140px'
  },
  clearButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  dateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
    paddingBottom: '0.25rem',
    borderBottom: '1px solid #e5e7eb'
  },
  timeslotGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    justifyContent: 'center'
  },
  timeslotCard: {
    backgroundColor: '#ebe8f9',
    border: '2px solid #f3f4f6',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    minHeight: '70px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden'
  },
  reservedCard: {
    backgroundColor: '#fef7f7',
    borderColor: '#f87171',
    boxShadow: '0 4px 6px -1px rgba(248, 113, 113, 0.2), 0 2px 4px -1px rgba(248, 113, 113, 0.1)'
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  facilityName: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  timeSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem'
  },
  timeRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    color: '#4b5563',
    fontWeight: '600'
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.2rem 0.6rem',
    borderRadius: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    border: '1px solid transparent'
  },
  availableBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    borderColor: '#22c55e'
  },
  reservedBadge: {
    backgroundColor: '#fecaca',
    color: '#dc2626',
    borderColor: '#ef4444'
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '2px solid #ef4444',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    marginLeft: '0.75rem',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
  },
  cancelButton: {
  backgroundColor: '#f44336', // red color for cancel
  color: 'white',
  padding: '6px 5px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
},
  reserveButton: {
  backgroundColor: '#4caf50',
  color: 'white',
  padding: '6px 5px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
},
};

export default TimeslotList;