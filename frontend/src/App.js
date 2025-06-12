// App.js
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import Dashboard from './components/Dashboard';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'dashboard'
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        setCurrentView('dashboard');
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return false;
    } else {
      setMessage('Logged in successfully!');
      return true;
    }
  };

  const handleRegister = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
      return false;
    } else {
      setMessage('Registration successful! Please check your email to confirm your account.');
      return true;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMessage('Logged out successfully!');
  };

  const switchToRegister = () => setCurrentView('register');
  const switchToLogin = () => setCurrentView('login');

  return (
    <div style={{ minHeight: '100vh' }}>
      {currentView === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onSwitchToRegister={switchToRegister}
          message={message}
          setMessage={setMessage}
        />
      )}
      
      {currentView === 'register' && (
        <RegisterScreen
          onRegister={handleRegister}
          onSwitchToLogin={switchToLogin}
          message={message}
          setMessage={setMessage}
        />
      )}
      
      {currentView === 'dashboard' && session && (
        <Dashboard
          session={session}
          onLogout={handleLogout}
          message={message}
          setMessage={setMessage}
        />
      )}
    </div>
  );
}

export default App;