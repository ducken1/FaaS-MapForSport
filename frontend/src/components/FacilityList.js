import React, { useState } from 'react';
import TimeslotForm from './TimeslotForm';
import TimeslotList from './TimeslotList';
import { Calendar, Trash2, ChevronDown, ChevronUp, Clock, Filter, Pencil } from 'lucide-react';

const FacilityList = ({ facilities, session, loading, onFacilityDeleted, setMessage }) => {
  const [showTimeslotForm, setShowTimeslotForm] = useState(null);
  const [showTimeslots, setShowTimeslots] = useState(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false); // ✅ new state
  const [editingFacility, setEditingFacility] = useState(null);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const currentUserId = session?.user?.id;

  const handleUpdateFacility = async () => {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/edit-facility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        id: editingFacility.id,
        name: editingFacility.name,
        description: editingFacility.description,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || 'Failed to update facility');
      return;
    }

    setMessage('Facility updated successfully!');
    setEditingFacility(null);
    onFacilityDeleted(); // 👈 call this to reload
  } catch (error) {
    setMessage('Error updating facility: ' + error.message);
  }
};


  const handleDeleteFacility = async (facilityId) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-facility`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: facilityId }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Facility deleted successfully!');
        onFacilityDeleted();
      } else {
        setMessage(result.error || 'Failed to delete facility');
      }
    } catch (error) {
      setMessage('Error deleting facility: ' + error.message);
    }
  };

  const handleTimeslotAdded = () => {
    setMessage('Timeslot added successfully!');
    setShowTimeslotForm(null);
  };

  const toggleTimeslots = (facilityId) => {
    setShowTimeslots(showTimeslots === facilityId ? null : facilityId);
  };

  const filteredFacilities = showOnlyMine
    ? facilities.filter(fac => fac.user_id === currentUserId)
    : facilities;

  if (loading) {
    return <div style={styles.loading}>Loading facilities...</div>;
  }

  if (filteredFacilities.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No facilities found.</p>
        <p style={styles.emptySubtext}>
          {showOnlyMine ? 'You have not created any facilities.' : 'Add your first facility to get started!'}
        </p>
      </div>
    );
  }


  
  return (
    <div style={styles.container}>
      {/* ✅ Filter Toggle Button */}
      <div style={styles.filterBar}>
        <button
          onClick={() => setShowOnlyMine(!showOnlyMine)}
          style={styles.filterButton}
        >
          <Filter size={14} />
          {showOnlyMine ? 'Show All Facilities' : 'Show Only My Facilities'}
        </button>
      </div>

      {filteredFacilities.map((fac) => {
        const isOwner = fac.user_id === currentUserId;

        

        return (
           <div key={fac.id} style={{ ...styles.facilityCard, padding: 6 }}>
            <div style={styles.facilityHeader}>
                
      {fac.image_filename && (
        <img
          src={`https://pndacpsajxjcxnywrkhk.supabase.co/storage/v1/object/public/facility-images/${fac.user_id}/${fac.image_filename}`}
          alt={`${fac.name} preview`}
          style={{
            width: '80px',
            height: '80px',
            objectFit: 'cover',
            margin: 0,          // No margin so image sticks
            border: '1px solid #ccc',
            borderRadius: 0,    // Cubic, no rounding
          }}
        />
      )}

              <div style={styles.facilityInfo}>
                <h4 style={styles.facilityName}>{fac.name}</h4>
                {fac.description && (
                  <p style={styles.facilityDescription}>{fac.description}</p>
                )}
                <span style={styles.facilityDate}>
                  {new Date(fac.created_at).toLocaleDateString()}
                </span>
              </div>



              <div style={styles.actionButtons}>
                {isOwner && (
                  <button
                    onClick={() => setShowTimeslotForm(fac.id)}
                    style={styles.timeslotButton}
                    title="Add Timeslot"
                  >
                    <Calendar size={16} />
                  </button>
                  
                )}

                {isOwner && (
                  <button
                    onClick={() => setEditingFacility(fac)}
                    style={styles.editButton}
                    title="Edit Facility"
                  >
                    <Pencil size={16} />
                  </button>
                )}

                <button
                  onClick={() => toggleTimeslots(fac.id)}
                  style={styles.viewTimeslotsButton}
                  title="View Timeslots"
                >
                  <Clock size={16} />
                  {showTimeslots === fac.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isOwner && (
                  <button
                    onClick={() => handleDeleteFacility(fac.id)}
                    style={styles.deleteButton}
                    title="Delete Facility"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {showTimeslotForm === fac.id && isOwner && (
              <div style={styles.formContainer}>
                <TimeslotForm
                  facilityId={fac.id}
                  facilityName={fac.name}
                  session={session}
                  onTimeslotAdded={handleTimeslotAdded}
                  onCancel={() => setShowTimeslotForm(null)}
                  setMessage={setMessage}
                />
              </div>
            )}

            {showTimeslots === fac.id && (
              <div style={styles.timeslotsContainer}>
                <div style={styles.timeslotsHeader}>
                  <h5 style={styles.timeslotsTitle}>Timeslots for {fac.name}</h5>
                </div>
                <TimeslotList
                  session={session}
                  facilityId={fac.id}
                  setMessage={setMessage}
                />
              </div>
            )}
          </div>
        );
      })}
{editingFacility && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalContent}>
      <h4 style={styles.modalTitle}>Edit Facility</h4>
      <div style={styles.inputGroup}>
  <label style={styles.label}>Facility Image</label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) {
        setEditingFacility({ ...editingFacility, newImageFile: file });
      }
    }}
  />
  {editingFacility.image_filename && (
    <img
      src={`${supabaseUrl}/storage/v1/object/public/facility-images/${editingFacility.user_id}/${editingFacility.image_filename}`}
      alt="Facility"
      style={{ width: 100, marginTop: 8 }}
    />
  )}
</div>
      <form 
        onSubmit={(e) => {
          e.preventDefault(); // Prevent default form submission
          handleUpdateFacility(); // Call your update function
        }}
        style={styles.form}
      >
        <div style={styles.inputGroup}>
          <label style={styles.label}>Facility Name</label>
          <input
            type="text"
            value={editingFacility.name}
            onChange={(e) =>
              setEditingFacility({ ...editingFacility, name: e.target.value })
            }
            style={styles.input}
            required
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            value={editingFacility.description || ''}
            onChange={(e) =>
              setEditingFacility({ ...editingFacility, description: e.target.value })
            }
            style={styles.textarea}
            rows="3"
          />
        </div>
        
        <div style={styles.buttonGroup}>
          <button 
            type="submit"  // Changed to type="submit"
            style={styles.submitButton}
          >
            Save Changes
          </button>
          <button 
            type="button"  // Important: specify type="button" for cancel
            onClick={() => setEditingFacility(null)} 
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
    
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: '2rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666'
  },
  emptyText: {
    fontSize: '1.1rem',
    fontWeight: '500',
    margin: '0 0 0.5rem 0',
    color: '#555'
  },
  emptySubtext: {
    fontSize: '0.95rem',
    margin: 0,
    color: '#777'
  },
  facilityCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem',
    transition: 'box-shadow 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  facilityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem'
  },
  facilityInfo: {
    flex: 1,
    minWidth: 0
  },
  facilityName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    margin: '0 0 0.25rem 0',
    color: '#2c3e50'
  },
  facilityDescription: {
    fontSize: '0.9rem',
    margin: '0 0 0.5rem 0',
    color: '#555',
    lineHeight: '1.4'
  },
  facilityDate: {
    fontSize: '0.8rem',
    color: '#888',
    fontWeight: '400'
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0
  },
  timeslotButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #28a745',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  viewTimeslotsButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #17a2b8',
    backgroundColor: '#17a2b8',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #dc3545',
    backgroundColor: '#dc3545',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  formContainer: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef'
  },
  timeslotsContainer: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef'
  },
  timeslotsHeader: {
    marginBottom: '0.75rem'
  },
  timeslotsTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    margin: 0,
    color: '#495057'
  },
    filterBar: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.4rem 0.75rem',
    fontSize: '0.9rem',
    backgroundColor: '#3b82f6',
    border: '1px solid #ccc',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s ease'
  },
  editButton: {
  backgroundColor: '#2196f3',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '6px 7px',
  cursor: 'pointer',
},
editModal: {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#fff',
  padding: '20px',
  zIndex: 1000,
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  borderRadius: '8px',
  minWidth: '300px',
  maxWidth: '500px',
},
 modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
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
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  textarea: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    width: '100%',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    boxSizing: 'border-box'
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem'
  },
  submitButton: {
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'background-color 0.2s ease',
    flex: 1,
  },
  cancelButton: {
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    color: '#555',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'background-color 0.2s ease',
    flex: 1,
  },
saveButton: {
  backgroundColor: '#4caf50',
  color: 'white',
  padding: '6px 12px',
  border: 'none',
  borderRadius: '4px',
  marginRight: '8px',
  cursor: 'pointer',
}
};

export default FacilityList;
