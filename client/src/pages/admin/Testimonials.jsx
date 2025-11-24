import React, { useState, useEffect } from "react";
import { FaStar, FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import Loading from "../../components/Loading";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch pending testimonials
  const fetchPendingTestimonials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth-token");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/pending`,
        { headers: { "auth-token": token } }
      );
      if (response.data.success) {
        setTestimonials(response.data.testimonials);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTestimonials();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle Approve
  const handleApprove = async (id) => {
    if (!window.confirm("Approve this testimonial?")) return;

    try {
      setActionLoading(id);
      const token = localStorage.getItem("auth-token");
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/approve/${id}`,
        {},
        { headers: { "auth-token": token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Remove from pending list
        setTestimonials(testimonials.filter((t) => t._id !== id));
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(error.response?.data?.detail || "Không thể duyệt");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject
  const handleReject = async (id) => {
    if (!window.confirm("Reject this testimonial?")) return;

    try {
      setActionLoading(id);
      const token = localStorage.getItem("auth-token");
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/reject/${id}`,
        {},
        { headers: { "auth-token": token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Remove from pending list
        setTestimonials(testimonials.filter((t) => t._id !== id));
      }
    } catch (error) {
      console.error("Reject error:", error);
      toast.error(error.response?.data?.detail || "Không thể từ chối");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this testimonial permanently?")) return;

    try {
      setActionLoading(id);
      const token = localStorage.getItem("auth-token");
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/admin/delete/${id}`,
        { headers: { "auth-token": token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setTestimonials(testimonials.filter((t) => t._id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.detail || "Không thể xóa");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pending Testimonials
        </h1>
        <p className="text-gray-600">
          Review and approve customer testimonials
        </p>
      </div>

      {testimonials.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">
            No pending testimonials at the moment
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {testimonials.map((testimonial) => (
                  <tr
                    key={testimonial._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={testimonial.userAvatar}
                          alt={testimonial.userName}
                          className="h-10 w-10 rounded-full ring-2 ring-gray-200"
                          onError={(e) => {
                            e.target.src = "https://i.pravatar.cc/150?img=0";
                          }}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {testimonial.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {testimonial.userId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            size={16}
                            className={
                              i < testimonial.rating
                                ? "text-[#FF532E]"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {testimonial.comment}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {formatDate(testimonial.createdAt)}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleApprove(testimonial._id)}
                          disabled={actionLoading === testimonial._id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <FaCheck size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(testimonial._id)}
                          disabled={actionLoading === testimonial._id}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <FaTimes size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(testimonial._id)}
                          disabled={actionLoading === testimonial._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {testimonials.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Total pending: <span className="font-semibold">{testimonials.length}</span>
        </div>
      )}
    </div>
  );
};

export default Testimonials;
