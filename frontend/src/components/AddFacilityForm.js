import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client once using env variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AddFacilityForm = ({ session, onFacilityAdded, setMessage }) => {
  const [facility, setFacility] = useState({ name: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddFacility = async () => {
    if (!facility.name) {
      setMessage('Name is required');
      return;
    }

    const token = session?.access_token;
    if (!token) {
      setMessage('Not authenticated');
      return;
    }

    setLoading(true);

    let imageUrl = null;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;       // <-- Save this filename
        const filePath = `${session.user.id}/${fileName}`;

        // Upload file to Supabase Storage bucket 'facility-images'
        const { error: uploadError } = await supabase
          .storage
          .from('facility-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) throw uploadError;

        imageUrl = fileName;
      }

      // Now call your Supabase Edge function to add the facility
      const response = await fetch(`${supabaseUrl}/functions/v1/add-facility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...facility, image_filename: imageUrl }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || 'Something went wrong');
      } else {
        setMessage('Facility added successfully!');
        setFacility({ name: '', description: '' });
        setImageFile(null);
        onFacilityAdded();
      }
    } catch (error) {
      setMessage('Error adding facility: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddFacility();
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Facility Name</label>
        <input
          type="text"
          placeholder="Enter facility name"
          value={facility.name}
          onChange={e => setFacility({ ...facility, name: e.target.value })}
          style={styles.input}
          required
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Description</label>
        <textarea
          placeholder="Enter facility description (optional)"
          value={facility.description}
          onChange={e => setFacility({ ...facility, description: e.target.value })}
          style={styles.textarea}
          rows="3"
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files[0])}
          style={styles.input}
        />
      </div>

      <button type="submit" disabled={loading} style={styles.submitButton}>
        <Plus size={18} style={{ marginRight: '8px' }} />
        {loading ? 'Adding...' : 'Add Facility'}
      </button>
    </form>
  );
};

const styles = {
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
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'background-color 0.2s ease',
    alignSelf: 'flex-start',
    minWidth: '140px'
  }
};

export default AddFacilityForm;
