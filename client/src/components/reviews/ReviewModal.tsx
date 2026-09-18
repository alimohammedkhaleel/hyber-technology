import React, { useState } from 'react';
import { reviewService } from '../../services/api/reviewService';
import { Star, X, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import './ReviewModal.css';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  orderId?: string;
  bookingId?: string;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  vendorId,
  vendorName,
  orderId,
  bookingId,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('يرجى اختيار تقييم من 1 إلى 5 نجوم');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await reviewService.createReview({
        vendor_id: vendorId,
        order_id: orderId,
        booking_id: bookingId,
        rating,
        comment: comment.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'فشل في إرسال التقييم. قد تكون قمت بتقييم هذا الطلب مسبقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-modal-overlay">
      <div className="review-modal-box">
        <div className="review-modal-header">
          <div className="review-header-title">
            <Star className="review-star-icon" size={22} fill="#f59e0b" color="#f59e0b" />
            <h3>تقييم تجربتك مع {vendorName}</h3>
          </div>
          <button className="review-close-btn" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="review-success-state">
            <CheckCircle2 size={48} className="review-success-icon" />
            <h4>شكراً لك!</h4>
            <p>تم استلام تقييمك بنجاح ومشاركته مع إدارة الجودة والمتجر.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="review-form">
            {error && (
              <div className="review-error-alert">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="rating-selector-group">
              <label className="rating-label">درجة التقييم العام:</label>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${isFilled ? 'filled' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        size={32}
                        fill={isFilled ? '#f59e0b' : 'none'}
                        color={isFilled ? '#f59e0b' : '#cbd5e1'}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="rating-text-hint">
                {rating === 5 && 'ممتاز جداً'}
                {rating === 4 && 'جيد جداً'}
                {rating === 3 && 'مقبول'}
                {rating === 2 && 'أقل من المتوقع'}
                {rating === 1 && 'سيء'}
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="review-comment" className="rating-label">
                اكتب رأيك أو ملاحظاتك (اختياري):
              </label>
              <textarea
                id="review-comment"
                className="review-textarea"
                rows={4}
                placeholder="شاركنا تفاصيل تجربتك، سرعة الخدمة، وجودة المنتجات..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />
              <span className="char-count">{comment.length}/500</span>
            </div>

            <div className="review-modal-actions">
              <button
                type="submit"
                className="review-submit-btn"
                disabled={loading || rating < 1}
              >
                <Send size={16} />
                <span>{loading ? 'جاري الإرسال...' : 'إرسال التقييم'}</span>
              </button>
              <button
                type="button"
                className="review-cancel-btn"
                onClick={onClose}
                disabled={loading}
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
