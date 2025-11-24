import React, { useState, useEffect, useContext } from "react";
import { FaStar, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import Title from "../components/Title";
import WriteTestimonialModal from "../components/WriteTestimonialModal";
import { ShopContext } from "../context/ShopContext";
import Loading from "../components/Loading";

const Testimonial = () => {
  const { user } = useContext(ShopContext);
  const [testimonials, setTestimonials] = useState([]);
  const [myTestimonial, setMyTestimonial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("user_token") || localStorage.getItem("admin_token");
  };

  // Fetch all approved testimonials (public)
  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/list`
      );
      if (response.data.success) {
        setTestimonials(response.data.testimonials);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    }
  };

  // Fetch user's own testimonial (if logged in)
  const fetchMyTestimonial = async () => {
    const token = getToken();
    if (!token) {
      setMyTestimonial(null);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/my-testimonial`,
        { headers: { "auth-token": token } }
      );
      if (response.data.success) {
        setMyTestimonial(response.data.testimonial);
      }
    } catch (error) {
      console.error("Error fetching my testimonial:", error);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTestimonials();
      await fetchMyTestimonial();
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Handle Write Review button
  const handleWriteReview = () => {
    const token = getToken();
    if (!token && !user) {
      toast.error("Vui lòng đăng nhập để viết đánh giá");
      return;
    }
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Handle Edit button
  const handleEdit = () => {
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Handle Delete button
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) {
      return;
    }

    try {
      const token = getToken();
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/testimonial/delete`,
        { headers: { "auth-token": token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        setMyTestimonial(null);
        await fetchTestimonials();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.detail || "Không thể xóa đánh giá");
    }
  };

  // Handle modal success (refresh data)
  const handleModalSuccess = async () => {
    await fetchMyTestimonial();
    await fetchTestimonials();
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };
    return badges[status] || "";
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-padd-container py-16 pt-28 bg-gradient-to-br from-white via-gray-50 to-gray-100 min-h-screen">
      {/* Title */}
      <Title
        title1={"Khách hàng"}
        title2={"nói gì"}
        titleStyles={"pb-10"}
        paraStyles={"!block"}
        para={
          "Câu chuyện thực từ khách hàng hài lòng chia sẻ trải nghiệm, cảm hứng phong cách và phản hồi đáng tin cậy về những gì họ yêu thích."
        }
      />

      {/* Write Review Button & My Testimonial */}
      <div className="mb-12">
        {!myTestimonial ? (
          <button
            onClick={handleWriteReview}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium shadow-lg"
          >
            <FaPlus size={18} />
            Viết đánh giá
          </button>
        ) : (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-gray-200/50 max-w-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Đánh giá của bạn
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                      myTestimonial.status
                    )}`}
                  >
                    {myTestimonial.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(myTestimonial.createdAt)}
                  </span>
                </div>
              </div>

              {/* Edit/Delete buttons (only for pending) */}
              {myTestimonial.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Chỉnh sửa"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Xóa"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  size={20}
                  className={
                    i < myTestimonial.rating
                      ? "text-[#FF532E]"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>

            {/* Comment */}
            <p className="text-gray-700 leading-relaxed">
              "{myTestimonial.comment}"
            </p>

            {/* Info message */}
            {myTestimonial.status === "pending" && (
              <p className="text-xs text-gray-500 mt-4 italic">
                Your review is awaiting admin approval. You can edit or delete
                it while pending.
              </p>
            )}
            {myTestimonial.status === "rejected" && (
              <p className="text-xs text-red-600 mt-4 italic">
                Your review was rejected by admin. Please contact support for
                more information.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Approved Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {testimonials.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">
              No approved reviews yet. Be the first to share your experience!
            </p>
          </div>
        ) : (
          testimonials.map((testimonial) => (
            <div
              key={testimonial._id}
              className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-6 space-y-4 border border-gray-200/50 hover:shadow-2xl transition-shadow"
            >
              {/* Header: Rating & Date */}
              <div className="flex justify-between items-center">
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
                <p className="text-xs text-gray-500">
                  {formatDate(testimonial.createdAt)}
                </p>
              </div>

              {/* Comment */}
              <p className="text-gray-700 leading-relaxed">
                "{testimonial.comment}"
              </p>

              {/* User Info */}
              <div className="flex items-center gap-3 pt-2">
                <img
                  className="h-10 w-10 rounded-full ring-2 ring-gray-200"
                  src={testimonial.userAvatar}
                  alt={testimonial.userName}
                  onError={(e) => {
                    e.target.src = "https://i.pravatar.cc/150?img=0";
                  }}
                />
                <p className="text-gray-900 font-semibold">
                  {testimonial.userName}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write Testimonial Modal */}
      <WriteTestimonialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        existingData={myTestimonial}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Testimonial;
