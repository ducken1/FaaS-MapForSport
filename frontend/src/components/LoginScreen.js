import React, { useState } from 'react';

const LoginScreen = ({ onLogin, onSwitchToRegister, message, setMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const success = await onLogin(email, password);
    if (success) {
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>MapForSport</h1>
        <h2 style={styles.title}>Sign in to your account</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button type="button" onClick={onSwitchToRegister} style={styles.secondaryButton}>
            Don't have an account? Register
          </button>
        </form>
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
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f7f9fc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  },
  card: {
    backgroundColor: '#fff',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  logo: {
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#2c3e50',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '500',
    marginBottom: '1.5rem',
    color: '#555'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  input: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem'
  },
  primaryButton: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    fontWeight: '500'
  },
  message: {
    marginTop: '1.5rem',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.95rem'
  }
};

export default LoginScreen;
