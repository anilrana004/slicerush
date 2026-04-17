import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitReview } from "@/hooks/use-reviews";
import { CheckCircle2, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface ReviewModalProps {
  orderId: string;
  onClose: () => void;
}

export function ReviewModal({ orderId, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submitReview = useSubmitReview();

  const handleSubmit = async () => {
    if (rating === 0) return;
    await submitReview.mutateAsync({
      orderId,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitted(true);
  };

  const activeRating = hovered || rating;

  return (
    <div className="review-modal-overlay" data-ocid="review_modal.dialog">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="review-modal-card relative z-10"
        data-ocid="review_modal.card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="review-modal-accent" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="review_modal.close_button"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center py-6 text-center gap-4"
              data-ocid="review_modal.success_state"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 18,
                  delay: 0.1,
                }}
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  Review Submitted!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Thanks for sharing your feedback. It helps us serve you
                  better.
                </p>
              </div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 transition-colors ${
                      s <= rating
                        ? "fill-accent text-accent"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <Button
                onClick={onClose}
                className="mt-2 bg-primary text-primary-foreground font-semibold"
                data-ocid="review_modal.done_button"
              >
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="font-display text-xl font-bold text-foreground mt-2 mb-1">
                Rate Your Order
              </h3>
              <p className="text-muted-foreground text-sm mb-2">
                How was your experience?
              </p>

              {/* Star selector */}
              <fieldset
                className="star-rating border-none p-0 m-0"
                aria-label="Rating"
                data-ocid="review_modal.star_rating"
              >
                <legend className="sr-only">Star Rating</legend>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                    aria-pressed={rating === star}
                    className={`star-button ${rating === star ? "star-pop" : ""}`}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                    data-ocid={`review_modal.star.${star}`}
                  >
                    <Star
                      className={`w-9 h-9 transition-all duration-150 ${
                        star <= activeRating
                          ? "fill-accent text-accent scale-110"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </fieldset>

              {/* Label */}
              <AnimatePresence mode="wait">
                {activeRating > 0 && (
                  <motion.p
                    key={activeRating}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-center text-sm font-medium text-accent mb-4 -mt-2"
                  >
                    {
                      ["", "Poor", "Fair", "Good", "Great", "Excellent!"][
                        activeRating
                      ]
                    }
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Comment */}
              <div className="space-y-1.5 mb-6">
                <label
                  htmlFor="review-comment"
                  className="text-sm font-medium text-foreground"
                >
                  Comment{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <Textarea
                  id="review-comment"
                  placeholder="Tell us what you loved — or what we could improve..."
                  value={comment}
                  onChange={(e) => {
                    if (e.target.value.length <= 300)
                      setComment(e.target.value);
                  }}
                  className="resize-none h-24 text-sm"
                  data-ocid="review_modal.comment_textarea"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {comment.length}/300
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={submitReview.isPending}
                  data-ocid="review_modal.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground font-semibold"
                  onClick={() => void handleSubmit()}
                  disabled={rating === 0 || submitReview.isPending}
                  data-ocid="review_modal.submit_button"
                >
                  {submitReview.isPending ? "Submitting…" : "Submit Review"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
