// Danh sách các đơn hàng mà người dùng đã đặt
// Người dùng xem lại các đơn hàng trước đây của họ với chi tiết sản phẩm và trạng thái đơn hàng.
import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

// Logic truy xuất dữ liệu đơn hàng và hiển thị chúng
const MyOrders = () => {
  const { currency, user, axios } = useContext(ShopContext); // axios từ context để gọi API
  const [orders, setOrders] = useState([]);

  // Hàm tải dữ liệu đơn hàng từ server
  const loadOrderData = async () => {
    if (!user) return; // Kiểm tra người dùng đăng nhập
    try {
      const { data } = await axios.post("/api/order/userorders"); // Gửi yêu cầu POST đến endpoint /api/order/userorders để lấy đơn hàng của người dùng
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.log(error);
    }
  };

  // Kích hoạt tải dữ liệu đơn hàng khi component được mount hoặc khi user thay đổi
  /* chỉ được gọi ngay sau khi component render và khi đối tượng user đã được xác định (tức là người dùng đã đăng nhập thành công).*/
  useEffect(() => {
    if (user) loadOrderData();
  }, [user]);

  // Hiển thị giao diện đơn hàng
  return (
    <div className="max-padd-container py-16 pt-28 bg-primary">
      <Title title1="My Orders" title2="List" titleStyles="pb-10" />

      {orders.map((order) => ( // Lặp qua từng đơn hàng
        <div key={order._id} className="bg-white p-2 mt-3 rounded-sm">

          {/* Hiển thị sản phẩm trong đơn hàng - Products List - vòng lặp con */}
          {/* Bên trong mỗi đơn hàng, vòng lặp con duyệt qua order.items (danh sách các sản phẩm/mặt hàng trong đơn hàng đó). */}
          {order.items.map((item, idx) => (
            <div key={idx} className="text-gray-700 flex flex-col lg:flex-row gap-4 mb-3">
              <div className="flex flex-[2] gap-x-3">
                <div className="flexCenter bg-primary">
                  <img src={item.product.image[0]} alt="" className="max-h-20 max-w-20 object-contain" /> {/* Hình ảnh sản phẩm */}
                </div>

                <div className="block w-full">
                  {/* Thông tin sản phẩm */}
                  <h5 className="h5 capitalize line-clamp-1">{item.product.name}</h5>
                  <div className="flex flex-wrap gap-3 max-sm:gap-y-1 mt-1">
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Price:</h5>
                      <p>{currency}{item.product.offerPrice}</p>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Quantity:</h5>
                      <p>{item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Size:</h5>
                      <p>{item.size}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Hiển thị tóm tắt và trạng thái đơn hàng - Order Summary */}
          {/* Hiển thị thông tin tổng quan của đơn hàng như ID, trạng thái thanh toán, tổng số tiền, ngày đặt hàng và trạng thái giao hàng. */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-t border-gray-300 pt-3">
            <div className="flex flex-col gap-2">
              {/* Thông tin chi tiết đơn hàng - bên trái */}
              <div className="flex items-center gap-x-2">
                <h5 className="medium-14">OrderId:</h5>
                <p className="text-gray-400 text-xs break-all">{order._id}</p> {/* Thuộc tính break-all giúp đảm bảo chuỗi ID dài không làm vỡ bố cục trên màn hình hẹp. */}
              </div>
              {/* Trạng thái đơn hàng và phương thức thanh toán */}
              <div className="flex gap-4">
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Payment Status:</h5>
                  <p className="text-gray-400 text-sm">
                    {order.isPaid ? "Done" : "Pending"}
                  </p>
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Method:</h5>
                  <p className="text-gray-400 text-sm">{order.paymentMethod}</p>
                </div>
                </div>
              </div>
              {/* Ngày đặt hàng và tổng số tiền */}
               <div className="flex gap-4">
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Date:</h5>
                  <p className="text-gray-400 text-sm">
                    {new Date(order.createdAt).toDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Amount:</h5>
                  <p className="text-gray-400 text-sm">
                     {currency}{order.amount}
                  </p>
                </div>
              </div>
            </div>
            {/* Trạng thái đơn hàng và nút tương tác (theo dõi) - bên phải */}
            {/* Trạng thái đơn hàng */}
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <h5 className="medium-14">Status:</h5>
                <div className="flex items-center gap-1">
                  <span className="min-w-2 h-2 rounded-full bg-green-500"></span>
                  <p>{order.status}</p>
                </div>
              </div>
              {/* Nút track order */}
              <button
                onClick={loadOrderData}
                className="btn-secondary !py-1 !text-xs rounded-sm"
              >
                Track Order
              </button>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default MyOrders;
