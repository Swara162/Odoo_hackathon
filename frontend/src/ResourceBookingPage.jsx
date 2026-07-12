import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import { formatDisplayDate } from './utils/dateFormat';
import './ResourceBookingPage.css';
import './AppShell.css';

import api from './api';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/Toast';

const EMPTY_FORM = {
  resource_name: '',
  booking_date: '',
  start_time: '',
  end_time: '',
  purpose: '',
};

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function findBookingOverlap(bookings, resourceName, bookingDate, startTime, endTime, excludeId = null) {
  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);
  return bookings.find((booking) => {
    if (booking.id === excludeId) return false;
    if (booking.resource_name !== resourceName || booking.booking_date !== bookingDate) return false;
    const currentStart = toMinutes(booking.start_time);
    const currentEnd = toMinutes(booking.end_time);
    return newStart < currentEnd && newEnd > currentStart;
  });
}

export default function ResourceBookingPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [selectedResource, setSelectedResource] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [bkRes, astRes, usrRes] = await Promise.all([
          api.get('/bookings/').catch(() => ({ data: [] })),
          api.get('/assets/'),
          api.get('/admin/employees'),
        ]);
        setBookings(bkRes.data);
        setAssets(astRes.data);
        setUsers(usrRes.data);
        const bookable = astRes.data.filter((a) => a.is_bookable || a.bookable);
        if (bookable.length > 0) setSelectedResource(bookable[0].name);
      } catch (err) {
        toast.error('Failed to load booking data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);



  const selectedResourceBookings = useMemo(() => {
    return bookings.filter((booking) => booking.resource_name === selectedResource).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [bookings, selectedResource]);

  const upcomingBookings = useMemo(() => {
    return [...bookings].sort((a, b) => a.booking_date.localeCompare(b.booking_date));
  }, [bookings]);

  const openForm = (booking = null) => {
    if (booking) {
      setEditingBookingId(booking.id);
      setForm({
        resource_name: booking.resource_name,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        purpose: booking.purpose,
      });
      setSelectedResource(booking.resource_name);
    } else {
      setEditingBookingId(null);
      setForm({ ...EMPTY_FORM, resource_name: selectedResource || resourceOptions[0]?.name || '' });
    }
    setErrors({});
    setShowForm(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.resource_name) nextErrors.resource_name = 'Select a resource.';
    if (!form.booking_date) nextErrors.booking_date = 'Choose a date.';
    if (!form.start_time) nextErrors.start_time = 'Select a start time.';
    if (!form.end_time) nextErrors.end_time = 'Select an end time.';
    if (form.start_time && form.end_time && form.start_time >= form.end_time) nextErrors.end_time = 'End time must be after start time.';
    if (!form.purpose.trim()) nextErrors.purpose = 'Add a purpose.';
    if (!nextErrors.end_time && form.resource_name && form.booking_date && form.start_time && form.end_time) {
      const conflict = findBookingOverlap(bookings, form.resource_name, form.booking_date, form.start_time, form.end_time, editingBookingId);
      if (conflict) {
        nextErrors.overlap = `Conflicts with ${conflict.start_time}–${conflict.end_time}`;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingBookingId) {
        const { data } = await api.put(`/bookings/${editingBookingId}`, {
          resource_name: form.resource_name,
          booking_date: form.booking_date,
          start_time: form.start_time,
          end_time: form.end_time,
          purpose: form.purpose.trim(),
        });
        setBookings((prev) => prev.map((b) => (b.id === editingBookingId ? data : b)));
        toast.success('Booking rescheduled');
      } else {
        const { data } = await api.post('/bookings/', {
          resource_name: form.resource_name,
          booking_date: form.booking_date,
          start_time: form.start_time,
          end_time: form.end_time,
          purpose: form.purpose.trim(),
        });
        setBookings((prev) => [data, ...prev]);
        toast.success('Booking created');
      }
      setShowForm(false);
      setEditingBookingId(null);
      setForm(EMPTY_FORM);
      setSelectedResource(form.resource_name);
    } catch (err) {
      toast.error('Failed to save booking');
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  const resourceOptions = useMemo(() => assets.filter((a) => a.is_bookable || a.bookable), [assets]);
  const resolveUserName = (userId) => users.find((u) => u.id === userId)?.full_name || '—';

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="app-content">
        <main className="booking-page">
          <header className="booking-topbar">
            <div>
              <p className="booking-eyebrow">AssetFlow / Bookings</p>
              <h1 className="booking-title">Resource Booking</h1>
            </div>
            <button className="booking-primary-btn" onClick={() => openForm()}>
              <i className="ti ti-calendar-plus" aria-hidden="true"></i>
              Book resource
            </button>
          </header>

          {loading ? (
            <div className="booking-loading">Loading booking calendar…</div>
          ) : (
            <>
              <section className="booking-grid">
                <div className="booking-panel">
                  <div className="booking-panel-header">
                    <h2>Calendar view</h2>
                    <select value={selectedResource} onChange={(event) => setSelectedResource(event.target.value)}>
                      {resourceOptions.map((resource) => (
                        <option key={resource.id} value={resource.name}>
                          {resource.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="day-grid" aria-label="Booking timeline">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <React.Fragment key={hour}>
                        <div className="hour-label">{String(hour).padStart(2, '0')}:00</div>
                        <div className="hour-slot">
                          {selectedResourceBookings.filter((booking) => booking.start_time.startsWith(String(hour).padStart(2, '0'))).map((booking) => (
                            <div key={booking.id} className="booking-block" style={{ top: `${toMinutes(booking.start_time) - hour * 60}px`, height: `${toMinutes(booking.end_time) - toMinutes(booking.start_time)}px` }}>
                              <strong>{booking.purpose}</strong>
                              <span>{booking.start_time}–{booking.end_time}</span>
                            </div>
                          ))}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                  {selectedResourceBookings.length === 0 && <div className="empty-state booking-empty">No bookings for this resource yet</div>}
                </div>

                <div className="booking-panel">
                  <div className="booking-panel-header">
                    <h2>Upcoming bookings</h2>
                  </div>
                  {upcomingBookings.length === 0 ? (
                    <div className="empty-state">No bookings found</div>
                  ) : (
                    <div className="booking-list">
                      {upcomingBookings.map((booking) => {
                        const toneClass = booking.resource_name.includes('Room')
                          ? 'booking-list-item-blue'
                          : booking.resource_name.includes('Projector')
                            ? 'booking-list-item-violet'
                            : 'booking-list-item-green';

                        return (
                          <div key={booking.id} className={`booking-list-item ${toneClass}`}>
                            <div className="booking-list-item-content">
                              <div className="booking-date-pill">{formatDisplayDate(booking.booking_date)}</div>
                              <div className="booking-time-row"><i className="ti ti-clock" aria-hidden="true"></i> {booking.start_time} – {booking.end_time}</div>
                              <strong className="booking-resource-title">{booking.resource_name}</strong>
                              <p className="booking-purpose">{booking.purpose}</p>
                              <p className="booking-muted">Booked by {resolveUserName(booking.booked_by)}</p>
                            </div>
                            <div className="booking-list-actions">
                              <span className={`booking-status-chip ${booking.status === 'UPCOMING' ? 'status-blue' : booking.status === 'ONGOING' ? 'status-green' : booking.status === 'CANCELLED' ? 'status-red' : 'status-gray'}`}>{booking.status}</span>
                              {booking.status !== 'CANCELLED' && (
                                <>
                                  <button className="booking-link-btn" onClick={() => handleCancel(booking.id)}>Cancel</button>
                                  <button className="booking-link-btn" onClick={() => openForm(booking)}>Reschedule</button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {showForm && (
        <div className="booking-modal-overlay" role="presentation" onClick={() => setShowForm(false)}>
          <div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-form-title" onClick={(event) => event.stopPropagation()}>
            <div className="booking-modal-header">
              <div>
                <p className="booking-eyebrow">Book resource</p>
                <h2 id="booking-form-title">{editingBookingId ? 'Reschedule booking' : 'New booking'}</h2>
              </div>
              <button className="booking-icon-btn" onClick={() => setShowForm(false)} aria-label="Close form">
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              <label className="booking-form-field">
                <span>Resource</span>
                <select value={form.resource_name} onChange={(event) => setForm((prev) => ({ ...prev, resource_name: event.target.value }))}>
                  <option value="">Select resource</option>
                  {resourceOptions.map((resource) => (
                    <option key={resource.id} value={resource.name}>{resource.name}</option>
                  ))}
                </select>
                {errors.resource_name && <small>{errors.resource_name}</small>}
              </label>

              <label className="booking-form-field">
                <span>Date</span>
                <input type="date" value={form.booking_date} onChange={(event) => setForm((prev) => ({ ...prev, booking_date: event.target.value }))} />
                {errors.booking_date && <small>{errors.booking_date}</small>}
              </label>

              <label className="booking-form-field">
                <span>Start time</span>
                <input type="time" value={form.start_time} onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))} />
                {errors.start_time && <small>{errors.start_time}</small>}
              </label>

              <label className="booking-form-field">
                <span>End time</span>
                <input type="time" value={form.end_time} onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))} />
                {errors.end_time && <small>{errors.end_time}</small>}
              </label>

              <label className="booking-form-field">
                <span>Purpose</span>
                <textarea rows={4} value={form.purpose} onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))} />
                {errors.purpose && <small>{errors.purpose}</small>}
              </label>

              {errors.overlap && <div className="booking-error">{errors.overlap}</div>}

              <div className="booking-modal-actions">
                <button type="button" className="booking-secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="booking-primary-btn">Save booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
