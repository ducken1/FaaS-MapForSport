import React, { useEffect, useState } from 'react';
import AddFacilityForm from './AddFacilityForm';
import FacilityList from './FacilityList';
import { LogOut } from 'lucide-react';

const Dashboard = ({ session, onLogout, message, setMessage }) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

  useEffect(() => {
    if (session) {
      fetchFacilities();
    }
  }, [session]);

  const fetchFacilities = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/get-facilities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        setFacilities(result.data || []);
      } else {
        setMessage(result.error || 'Failed to fetch facilities');
      }
    } catch (error) {
      setMessage('Error fetching facilities: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityAdded = () => {
    fetchFacilities();
  };

  const handleFacilityDeleted = () => {
    fetchFacilities();
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>MapForSport</h1>
        <button onClick={onLogout} style={styles.logoutButton}>
          <LogOut size={18} style={{ marginRight: '8px' }} />
          Odjava
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Left Column - Add Facility */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Dodaj novo ustanovo</h2>
            <AddFacilityForm
              session={session}
              onFacilityAdded={handleFacilityAdded}
              setMessage={setMessage}
            />
          </div>

          {/* Message Display */}
          {message && (
            <div style={{
              ...styles.message,
              backgroundColor: message.toLowerCase().includes('error') ? '#fdecea' : '#e6f4ea',
              borderColor: message.toLowerCase().includes('error') ? '#f5c2c7' : '#b7e4c7',
              color: message.toLowerCase().includes('error') ? '#a94442' : '#2d6a4f'
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Right Column - Facilities List */}
        <div style={styles.rightColumn}>
          <div style={styles.facilitiesCard}>
            <h2 style={styles.cardTitle}>Seznam ustanov</h2>
            <FacilityList
              facilities={facilities}
              session={session}
              loading={loading}
              onFacilityDeleted={handleFacilityDeleted}
              setMessage={setMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f7f9fc',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: '#fff',
    padding: '1.5rem 2rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb'
  },
  logo: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#2c3e50',
    margin: 0
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #dc3545',
    backgroundColor: '#dc3545',
    color: '#fff',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease'
  },
  main: {
    flex: 1,
    display: 'flex',
    gap: '2rem',
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    alignItems: 'flex-start'
  },
  card: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 1.5rem 0'
  },
  leftColumn: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  rightColumn: {
    flex: '1.2',
    minWidth: '0'
  },
  facilitiesCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  message: {
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.95rem',
    textAlign: 'center',
    fontWeight: '500'
  }
};

export default Dashboard;