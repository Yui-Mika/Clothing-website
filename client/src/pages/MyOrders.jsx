import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { FaStar } from "react-icons/fa";
import OrderTrackingModal from "../components/OrderTrackingModal";

const MyOrders = () => {
  const { currency, formatCurrency, user, axios, navigate, translateStatus } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [reviewedProducts, setReviewedProducts] = useState(new Set()); // Track reviewed products
  const [showTracking, setShowTracking] = useState(false); // State for tracking modal
  const [selectedOrder, setSelectedOrder] = useState(null); // Selected order for tracking

  const loadOrderData = async () => {
    if (!user) return;
    try {
      const { data } = await axios.post("/api/order/userorders");
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.log(error);
    }
  };

  // Check if user already reviewed a product
  const checkIfReviewed = async (productId) => {
    try {
      const { data } = await axios.get(`/api/review/user/my-reviews`);
      if (data.success) {
        const reviewed = data.reviews.some(review => review.productId === productId);
        return reviewed;
      }
      return false;
    } catch (error) {
      console.log("Error checking review:", error);
      return false;
    }
  };

  // Load user's reviewed products
  const loadReviewedProducts = async () => {
    try {
      const { data } = await axios.get(`/api/review/user/my-reviews`);
      if (data.success) {
        const productIds = new Set(data.reviews.map(review => review.productId));
        setReviewedProducts(productIds);
      }
    } catch (error) {
      console.log("Error loading reviewed products:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrderData();
      loadReviewedProducts();
    }
  }, [user]);

  return (
    <div className="max-padd-container py-16 pt-28 bg-primary">
      <Title title1="Đơn hàng" title2="của tôi" titleStyles="pb-10" />

      {orders.map((order) => (
        <div key={order._id} className="bg-white p-2 mt-3 rounded-sm">

          {/* Products List */}
          {order.items.map((item, idx) => (
            <div key={idx} className="text-gray-700 flex flex-col lg:flex-row gap-4 mb-3">
              <div className="flex flex-[2] gap-x-3">
                <div className="flexCenter bg-primary">
                  <img src={item.product.image[0]} alt="" className="max-h-20 max-w-20 object-contain" />
                </div>

                <div className="block w-full">
                  <h5 className="h5 capitalize line-clamp-1">{item.product.name}</h5>
                  <div className="flex flex-wrap gap-3 max-sm:gap-y-1 mt-1">
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Giá:</h5>
                      <p>{formatCurrency(item.product.offerPrice)}{currency}</p>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Số lượng:</h5>
                      <p>{item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Kích cỡ:</h5>
                      <p>{item.size}</p>
                    </div>
                  </div>

                  {/* Review Button - Only show if order is Delivered and not reviewed yet */}
                  {order.status === "Delivered" && !reviewedProducts.has(item.product._id) && (
                    <button
                      onClick={() => navigate(`/product/${item.product._id}?review=true`)}
                      className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      <FaStar className="text-yellow-500" />
                      <span>Viết đánh giá</span>
                    </button>
                  )}

                  {/* Already Reviewed Badge */}
                  {order.status === "Delivered" && reviewedProducts.has(item.product._id) && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">
                      <FaStar className="text-green-500" />
                      <span>Đã đánh giá</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Order Summary */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-t border-gray-300 pt-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-x-2">
                <h5 className="medium-14">Mã đơn:</h5>
                <p className="text-gray-400 text-xs break-all">{order._id}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Thanh toán:</h5>
                  <p className="text-gray-400 text-sm">
                    {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                  </p>
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Phương thức:</h5>
                  <p className="text-gray-400 text-sm">{order.paymentMethod}</p>
                </div>
                </div>
              </div>
               <div className="flex gap-4">
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Ngày:</h5>
                  <p className="text-gray-400 text-sm">
                    {new Date(order.createdAt).toDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Tổng tiền:</h5>
                  <p className="text-gray-400 text-sm">
                     {formatCurrency(order.amount)}{currency}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <h5 className="medium-14">Trạng thái:</h5>
                <div className="flex items-center gap-1">
                  <span className="min-w-2 h-2 rounded-full bg-green-500"></span>
                  <p>{translateStatus(order.status)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(order);
                  setShowTracking(true);
                }}
                className="btn-secondary !py-1 !text-xs rounded-sm"
              >
                Theo dõi đơn hàng
              </button>
            </div>
          </div>

        </div>
      ))}

      {/* Order Tracking Modal */}
      <OrderTrackingModal 
        isOpen={showTracking}
        onClose={() => setShowTracking(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default MyOrders;
