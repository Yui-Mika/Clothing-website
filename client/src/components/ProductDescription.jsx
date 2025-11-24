// hiển thị các tab thông tin chi tiết về sản phẩm (như Mô tả, Hướng dẫn chăm sóc, Hướng dẫn màu sắc) trên trang chi tiết sản phẩm.
import React, { useState, useEffect } from "react";
import { FiStar, FiCheck } from "react-icons/fi";
import axios from "axios";
import WriteReviewModal from "./WriteReviewModal";

const ProductDescription = ({ product }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Fetch reviews when Reviews tab is active
  useEffect(() => {
    if (activeTab === "reviews" && product._id) {
      fetchReviews();
      fetchReviewStats();
    }
  }, [activeTab, product._id, sortBy]);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/review/product/${product._id}`,
        {
          params: { sort_by: sortBy, limit: 10 }
        }
      );
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/review/product/${product._id}/stats`
      );
      if (response.data.success) {
        setReviewStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    // Khung chứa toàn bộ phần mô tả sản phẩm với nền trắng
    <div className="mt-14 bg-white rounded-lg shadow-md">
      {/* Thanh tab bar cho các phần mô tả sản phẩm */}
      <div className="flex gap-3 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab("details")}
          className={`medium-14 p-3 w-32 border-b-2 transition-colors ${
            activeTab === "details" 
              ? "border-secondary text-secondary font-semibold" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Chi tiết
        </button>
        <button 
          onClick={() => setActiveTab("care")}
          className={`medium-14 p-3 w-32 border-b-2 transition-colors ${
            activeTab === "care" 
              ? "border-secondary text-secondary font-semibold" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Hướng dẫn bảo quản
        </button>
        <button 
          onClick={() => setActiveTab("reviews")}
          className={`medium-14 p-3 w-32 border-b-2 transition-colors ${
            activeTab === "reviews" 
              ? "border-secondary text-secondary font-semibold" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Đánh giá
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Details Tab - Product Specifications */}
        {activeTab === "details" && (
          <div className="flex flex-col gap-4">
            {/* Product Description - Hiển thị trước */}
            {product.detailedDescription && (
              <div className="mb-6">
                <h6 className="font-semibold text-gray-900 mb-3">Mô tả</h6>
                <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                  {product.detailedDescription.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Product Specifications - Hiển thị sau */}
            {product.details ? (
              <div className="pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {product.details.material && (
                    <div className="flex">
                      <span className="font-semibold text-gray-900 w-28">Chất liệu:</span>
                      <span className="text-gray-700">{product.details.material}</span>
                    </div>
                  )}
                  {product.details.fit && (
                    <div className="flex">
                      <span className="font-semibold text-gray-900 w-28">Kiểu dáng:</span>
                      <span className="text-gray-700">{product.details.fit}</span>
                    </div>
                  )}
                  {product.details.weight && (
                    <div className="flex">
                      <span className="font-semibold text-gray-900 w-28">Trọng lượng:</span>
                      <span className="text-gray-700">{product.details.weight}</span>
                    </div>
                  )}
                  {product.details.origin && (
                    <div className="flex">
                      <span className="font-semibold text-gray-900 w-28">Xuất xứ:</span>
                      <span className="text-gray-700">{product.details.origin}</span>
                    </div>
                  )}
                  {product.details.features && product.details.features.length > 0 && (
                    <div className="md:col-span-2 mt-2">
                      <span className="font-semibold text-gray-900 block mb-2">Đặc điểm nổi bật:</span>
                      <ul className="list-disc pl-5 text-gray-700 flex flex-col gap-1">
                        {product.details.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700 pt-6 border-t">
                <p>Thông số kỹ thuật hiện chưa có.</p>
              </div>
            )}
          </div>
        )}

        {/* Care Guide Tab */}
        {activeTab === "care" && (
          <div className="flex flex-col gap-4">
            {product.details?.care ? (
              <p className="text-sm text-gray-700 leading-relaxed">
                {product.details.care}
              </p>
            ) : (
              <ul className="list-disc pl-5 text-sm text-gray-700 flex flex-col gap-2">
                <li>Giặt máy với nước lạnh cùng màu tương tự</li>
                <li>Không sử dụng chất tẩy</li>
                <li>Sấy khô ở nhiệt độ thấp hoặc phơi khô</li>
                <li>Là ở nhiệt độ thấp nếu cần</li>
                <li>Không giặt khô</li>
              </ul>
            )}
          </div>
        )}

        {/* Reviews Tab - Customer Reviews Only */}
        {activeTab === "reviews" && (
          <div className="flex flex-col gap-6">
            {/* Review Stats Summary */}
            {reviewStats && reviewStats.totalReviews > 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Average Rating */}
                  <div className="text-center md:text-left">
                    <div className="flex items-baseline gap-2 justify-center md:justify-start">
                      <span className="text-5xl font-bold text-gray-900">
                        {reviewStats.averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500">/5</span>
                    </div>
                    <div className="flex gap-1 mt-2 justify-center md:justify-start">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(reviewStats.averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Dựa trên {reviewStats.totalReviews} đánh giá
                    </p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="flex-1 max-w-md">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewStats.ratingDistribution[star] || 0;
                      const percentage = reviewStats.totalReviews > 0 
                        ? (count / reviewStats.totalReviews) * 100 
                        : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600 w-6 text-right font-mono">{star}</span>
                          <span className="text-sm w-5">⭐</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-10 text-right font-mono">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sort & Write Review */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="rating_desc">Đánh giá cao nhất</option>
                  <option value="rating_asc">Đánh giá thấp nhất</option>
                </select>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(true)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md"
              >
                Viết đánh giá
              </button>
            </div>

            {/* Reviews List */}
            {isLoadingReviews ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-500 mt-4">Đang tải đánh giá...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="border-b border-gray-200 pb-6 last:border-b-0"
                  >
                    {/* Review Header */}
                    <div className="flex items-start gap-4">
                      <img
                        src={review.userAvatar}
                        alt={review.userName}
                        className="w-12 h-12 rounded-full border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {review.userName}
                              </span>
                              {review.verified && (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  <FiCheck className="w-3 h-3" />
                                  Đã mua hàng
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <FiStar
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {review.title}
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {review.comment}
                          </p>
                        </div>

                        {/* Purchase Date */}
                        {review.verified && review.purchaseDate && (
                          <p className="text-xs text-gray-500 mt-3">
                            Mua ngày {formatDate(review.purchaseDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h5 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đánh giá</h5>
                <p className="text-gray-500 text-sm mb-6">Hãy là người đầu tiên chia sẻ ý kiến về sản phẩm này</p>
                <button
                  onClick={() => setIsWriteModalOpen(true)}
                  className="px-8 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md"
                >
                  Viết đánh giá
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        productId={product._id}
        productName={product.name}
        onReviewSubmitted={() => {
          fetchReviews();
          fetchReviewStats();
        }}
      />
    </div>
  );
};

export default ProductDescription;
