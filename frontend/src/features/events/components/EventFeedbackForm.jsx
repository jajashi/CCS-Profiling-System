import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../providers/AuthContext';
import { FiStar, FiSend, FiX } from 'react-icons/fi';
import './EventFeedbackForm.css';

export default function EventFeedbackForm({ eventId, onClose, onSubmit }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch(`/api/events/${eventId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, comment })
      });

      if (res.ok) {
        setSuccess(true);
        if (onSubmit) onSubmit();
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to submit feedback');
      }
    } catch (err) {
      setError(err.message || 'Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const Star = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
    <FiStar
      className={`star ${filled ? 'filled' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );

  if (success) {
    return (
      <div className="feedback-form-container">
        <div className="feedback-success">
          <FiStar className="success-icon" />
          <h3>Thank you for your feedback!</h3>
          <p>Your response has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-form-container">
      <div className="feedback-form-header">
        <h2>Event Feedback</h2>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="rating-section">
          <label>How would you rate this event?</label>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                filled={star <= (hover || rating)}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              />
            ))}
          </div>
          <p className="rating-text">
            {rating === 0 ? 'Select a rating' : 
             rating === 1 ? 'Poor' :
             rating === 2 ? 'Fair' :
             rating === 3 ? 'Good' :
             rating === 4 ? 'Very Good' : 'Excellent'}
          </p>
        </div>

        <div className="comment-section">
          <label>Additional comments (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about the event..."
            rows={4}
            maxLength={500}
          />
          <p className="char-count">{comment.length}/500</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? (
            <>Submitting...</>
          ) : (
            <>
              <FiSend />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
