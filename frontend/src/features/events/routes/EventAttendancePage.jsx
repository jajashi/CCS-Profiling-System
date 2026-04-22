import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PlaceholderPage from '../../misc/routes/PlaceholderPage';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';

export default function EventAttendancePage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/events/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Unable to load event.');
        return;
      }
      setEvent(data);
      setError(null);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const isEventOrganizer = (event, user) => {
    if (!event || !user) return false;
    return (event.organizers || []).some(
      (org) => String(org.userId?._id || org.userId) === String(user.id || user._id)
    );
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const attendees = useMemo(
    () => (event?.attendees || []).filter((attendee) => attendee.rsvpStatus === 'registered'),
    [event]
  );
  const presentCount = attendees.filter((attendee) => attendee.attended).length;

  if (!isAdmin && !isEventOrganizer(event, user)) {
    return (
      <PlaceholderPage
        title="Forbidden"
        description="Only event organizers can access attendance tracking."
      />
    );
  }

  const toggleAttendance = async (userId, attended) => {
    setSavingUserId(userId);
    try {
      const res = await apiFetch(`/api/events/${id}/attendees/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Failed to update attendance.');
        return;
      }
      setEvent(data.event);
      setError(null);
    } catch {
      setError('Network error while updating attendance.');
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading attendance roster...</div>;
  if (error && !event) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: '10px' }}>
      <h2 style={{ marginTop: 0 }}>Attendance Tracker</h2>
      <p style={{ color: '#334155' }}>{event?.title}</p>
      <div style={{ marginBottom: '1rem', fontWeight: 700 }}>
        Present: {presentCount} / {attendees.length}
      </div>
      {error && <div style={{ color: '#b91c1c', marginBottom: '1rem' }}>{error}</div>}

      {attendees.length === 0 ? (
        <p>No RSVP attendees yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {attendees.map((attendee) => {
            const userId = attendee.userId?._id || attendee.userId;
            const name = attendee.userId?.name || attendee.userId?.username || 'Unknown user';
            const saving = String(savingUserId) === String(userId);
            return (
              <div key={String(userId)} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>{name}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleAttendance(userId, true)}
                    disabled={saving}
                    style={{ padding: '0.45rem 0.7rem', borderRadius: '6px', border: 0, background: attendee.attended ? '#166534' : '#22c55e', color: '#fff' }}
                  >
                    Mark Present
                  </button>
                  <button
                    onClick={() => toggleAttendance(userId, false)}
                    disabled={saving}
                    style={{ padding: '0.45rem 0.7rem', borderRadius: '6px', border: 0, background: !attendee.attended ? '#991b1b' : '#ef4444', color: '#fff' }}
                  >
                    Mark Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
