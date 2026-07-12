import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);

  const togglePasswordVisibility = (e) => {
    e.preventDefault(); // Prevent focus/submit issues
    setShowPassword((prev) => !prev);
  };

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailInvalid(false);
    setPasswordInvalid(false);

    let isValid = true;

    if (!email) {
      setEmailInvalid(true);
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailInvalid(true);
      isValid = false;
    }

    if (!password) {
      setPasswordInvalid(true);
      isValid = false;
    }

    if (!isValid) {
      setError('Please fill in all fields correctly.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate real API / auth call with setTimeout inside a Promise
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Replace this logic with your real auth handler, e.g.:
          // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          // if (error) reject(error); else resolve(data);
          
          if (email === 'demo@company.com' && password === 'password123') {
            resolve({ user: 'demo' });
          } else {
            reject(new Error('Incorrect email or password.'));
          }
        }, 1500);
      });

      // Navigate to the dashboard on successful login
      navigate('/dashboard');
    } catch (err) {
      // Set the error state based on auth failure
      setError(err.message || 'Incorrect email or password.');
      setEmailInvalid(true);
      setPasswordInvalid(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Column: Dark Brand Panel */}
      <section className="brand-panel">
        <div className="brand-inner">
          <div className="brand-header">
            <div className="brand-icon">
              <i className="ti ti-cube" aria-hidden="true"></i>
            </div>
            <span className="brand-name">AssetFlow</span>
          </div>

          <div className="brand-body">
            <h1 className="brand-headline">Every asset, accounted for.</h1>
            <p className="brand-subtext">
              Track allocations, bookings, and maintenance across your entire organization in one place.
            </p>
          </div>

          <div className="brand-stats">
            <div className="stat-block">
              <span className="stat-number">2,400+</span>
              <span className="stat-label">Assets tracked</span>
            </div>
            <div className="stat-block">
              <span className="stat-number">180+</span>
              <span className="stat-label">Organizations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Login Form */}
      <main className="form-panel">
        <div className="form-inner">
          <div className="form-header">
            <h2 className="form-title">Welcome back</h2>
            <p className="form-subtitle">Sign in to your AssetFlow account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email-input" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <i className="ti ti-mail input-icon-left" aria-hidden="true"></i>
                <input
                  id="email-input"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  aria-invalid={emailInvalid ? 'true' : 'false'}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password-input" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <i className="ti ti-lock input-icon-left" aria-hidden="true"></i>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  aria-invalid={passwordInvalid ? 'true' : 'false'}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i
                    className={showPassword ? 'ti ti-eye-off' : 'ti ti-eye'}
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
              {/* Forgot Password Link */}
              <a href="#forgot" className="forgot-password-link">
                Forgot password?
              </a>
            </div>

            {/* Inline Error Message */}
            {error && (
              <div className="error-message" role="alert">
                <i className="ti ti-alert-circle" aria-hidden="true"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="form-footer">
            Don't have an account?
            <button
              onClick={() => navigate('/signup')}
              className="form-footer-link"
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              Sign up
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
