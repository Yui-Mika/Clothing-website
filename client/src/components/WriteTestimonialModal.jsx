import React, { useState, useEffect } from "react";
import { FaStar, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

const WriteTestimonialModal = ({ isOpen, onClose, mode, existingData, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Load existing data when in edit mode
  useEffect(() => {
    if (mode === "edit" && existingData) {
      setRating(existingData.rating);
      setComment(existingData.comment);
    } else {
      // Reset form for create mode
      setRating(5);
      setComment("");
    }
  }, [mode, existingData, isOpen]);

  // Validation
  const validateForm = () => {
    if (comment.trim().length < 10) {
      toast.error("Comment must be at least 10 characters");
      return false;
    }
    if (comment.trim().length > 500) {
      toast.error("Comment must not exceed 500 characters");
      return false;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return false;
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("user_token") || localStorage.getItem("admin_token");
      if (!token) {
        toast.error("Please login to submit a review");
        setLoading(false);
        return;
      }

      const data = {
        rating,
        comment: comment.trim(),
      };

      let response;
      if (mode === "edit") {
        // Update existing testimonial
        response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/update`,
          data,
          { headers: { "auth-token": token } }
        );
      } else {
        // Create new testimonial
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/create`,
          data,
          { headers: { "auth-token": token } }
        );
      }

      if (response.data.success) {
        toast.success(response.data.message);
        onSuccess(); // Refresh parent component data
        onClose(); // Close modal
      }
    } catch (error) {
      console.error("Testimonial submit error:", error);
      toast.error(error.response?.data?.detail || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Close modal"
        >
          <FaTimes size={24} />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {mode === "edit" ? "Edit Your Review" : "Write a Review"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setRating(ratingValue)}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(null)}
                    className="transition-transform hover:scale-110"
                  >
                    <FaStar
                      size={32}
                      className={
                        ratingValue <= (hover || rating)
                          ? "text-[#FF532E]"
                          : "text-gray-300"
                      }
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with us... (10-500 characters)"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              required
            />
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>Minimum 10 characters</span>
              <span
                className={
                  comment.length > 500 ? "text-red-500 font-semibold" : ""
                }
              >
                {comment.length}/500
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : mode === "edit" ? "Update Review" : "Submit Review"}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Your review will be pending approval before appearing publicly.
        </p>
      </div>
    </div>
  );
};

export default WriteTestimonialModal;
