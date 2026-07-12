import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  // Individual field errors for detailed inline validation feedback
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    let isValid = true;
    const newErrors = { fullName: '', email: '', password: '', confirmPassword: '' };

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
      isValid = false;
    }

    if (!email) {
      newErrors.email = 'Email address is required.';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match.";
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Simulate real API / auth call with setTimeout inside a Promise
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate database unique constraints:
          if (email.toLowerCase() === 'taken@company.com') {
            reject(new Error('DUPLICATE_EMAIL'));
          } else {
            resolve();
          }
        }, 1500);
      });

      // Real auth call would look like this:
      // const { data, error } = await supabase.auth.signUp({
      //   email,
      //   password,
      //   options: {
      //     data: {
      //       full_name: fullName,
      //       role: 'employee' // Default role is assigned server-side or in metadata, never trusted blindly from client input.
      //     }
      //   }
      // });
      // if (error) throw error;

      alert('Account successfully created!');
      navigate('/login');
    } catch (err) {
      if (err.message === 'DUPLICATE_EMAIL') {
        setErrors((prev) => ({
          ...prev,
          email: 'An account with this email already exists.'
        }));
      } else {
        alert(err.message || 'An error occurred during sign up.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
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
            <h1 className="brand-headline">Get your organization set up.</h1>
            <p className="brand-subtext">
              Create your account to start tracking assets. An admin will assign your role once you're in.
            </p>
          </div>

          {/* Checklist */}
          <div className="features-list">
            <div className="feature-item">
              <i className="ti ti-check feature-icon" aria-hidden="true"></i>
              <span className="feature-text">Full asset lifecycle tracking</span>
            </div>
            <div className="feature-item">
              <i className="ti ti-check feature-icon" aria-hidden="true"></i>
              <span className="feature-text">Conflict-free allocation and booking</span>
            </div>
            <div className="feature-item">
              <i className="ti ti-check feature-icon" aria-hidden="true"></i>
              <span className="feature-text">Approval-gated maintenance workflow</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Signup Form */}
      <main className="form-panel">
        <div className="form-inner">
          <div className="form-header">
            <h2 className="form-title">Create your account</h2>
            <p className="form-subtitle">Takes less than a minute</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form" noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullname-input" className="form-label">
                Full Name
              </label>
              <div className="input-wrapper">
                <i className="ti ti-user input-icon-left" aria-hidden="true"></i>
                <input
                  id="fullname-input"
                  type="text"
                  className="form-input"
                  placeholder="Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  aria-invalid={errors.fullName ? 'true' : 'false'}
                  required
                />
              </div>
              {errors.fullName && (
                <span className="field-error-message" role="alert">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="email-input" className="form-label">
                Work Email
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
                  aria-invalid={errors.email ? 'true' : 'false'}
                  required
                />
              </div>
              {errors.email && (
                <span className="field-error-message" role="alert">
                  <i className="ti ti-alert-circle" aria-hidden="true"></i>
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password and Confirm Password Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password-input" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <i className="ti ti-lock input-icon-left" aria-hidden="true"></i>
                  <input
                    id="password-input"
                    type="password"
                    className="form-input"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    required
                  />
                </div>
                {errors.password && (
                  <span className="field-error-message" role="alert">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password-input" className="form-label">
                  Confirm Password
                </label>
                <div className="input-wrapper">
                  <i className="ti ti-lock input-icon-left" aria-hidden="true"></i>
                  <input
                    id="confirm-password-input"
                    type="password"
                    className="form-input"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="field-error-message" role="alert">
                    <i className="ti ti-alert-circle" aria-hidden="true"></i>
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            {/* Info Banner */}
            <div className="info-banner">
              <i className="ti ti-info-circle info-banner-icon" aria-hidden="true"></i>
              <p className="info-banner-text">
                Your account is created as an <strong>employee</strong> by default. An admin can promote you to Department Head or Asset Manager later from the organization directory.
              </p>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Creating account…</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="form-footer">
            Already have an account?
            <button
              onClick={() => navigate('/login')}
              className="form-footer-link"
              disabled={isLoading}
            >
              Log in
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
