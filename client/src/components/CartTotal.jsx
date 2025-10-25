// Tóm tắt chi tiết tài chính của giỏ hàng
// Hiển thị tổng tiền, phí vận chuyển, thuế và tổng cộng cuối cùng
// Nó cho phép chọn phương thức thanh toán khi ở trang đặt hàng (place-order)
import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext"; // Truy cập dữ liệu giỏ hàng và các hàm từ ShopContext
import { useLocation } from "react-router-dom";

// Truy cập dữ liệu giỏ hàng và các hàm từ ShopContext
const CartTotal = ({method, setMethod}) => { // Nhận method và setMethod từ component cha để quản lý phương thức thanh toán

  //Lấy các hàm và giá trị tính toán sẵn từ ShopContext
  // currency: đơn vị tiền tệ hiện tại
  // getCartAmount: hàm tính tổng tiền giỏ hàng
  // getCartCount: hàm đếm số lượng mặt hàng trong giỏ hàng
  // delivery_charges: phí vận chuyển cố định
  const { currency, getCartAmount, getCartCount, delivery_charges } = useContext(ShopContext);
  
  // Lấy thông tin về URL hiện tại để xác định xem người dùng có đang ở trang đặt hàng hay không
  const location = useLocation();
  const isOrderPage = location.pathname.includes("place-order");

  return (
    <div>
      <h3 className="bold-22">
        Order Summary{" "} {/* Hiển thị tiêu đề "Order Summary" */}
        <span className="bold-14 text-secondary">({getCartCount()} Items)</span> {/* Hiển thị số lượng mặt hàng trong giỏ hàng mà 
        ng dùng đã thêm */}
      </h3>
      <hr className="border-gray-300 my-5" />

      {/* PAYMENT METHOD */}
      {/* Chỉ hiển thị phần chọn phương thức thanh toán khi người dùng ở trang đặt hàng/thanh toán */}
      {isOrderPage && (
        <div className="mb-6">
          <div className="my-6">
            <h4 className="h4 mb-5">
              Payment <span>Method</span>
            </h4>
            <div className="flex gap-3">
              <div
                onClick={() => setMethod("COD")}
                className={`${
                  method === "COD" ? "btn-secondary" : "btn-light" // Kiểm tra nếu phương thức hiện tại là "COD" để áp dụng kiểu nút tương ứng
                } !py-1 text-xs cursor-pointer`}
              >
                Cash on Delivery
              </div>
              <div
                onClick={() => setMethod("stripe")} // Như trên, stripe ở đây là phương thức thanh toán trực tuyến
                className={`${
                  method === "stripe" ? "btn-secondary" : "btn-light"
                } !py-1 text-xs cursor-pointer`}
              >
                Stripe
              </div>
            </div>
          </div>
          <hr className="border-gray-300" />
        </div>
      )}

      {/* PRICE DETAILS */}
      {/* Hiển thị các mục chi phí dưới dạng key-value (tên khoản mục - số tiền) */}
      <div className=" mt-4 space-y-2">
        <div className="flex justify-between">
          <h5 className="h5">Price</h5>
          <p className="font-bold">
            {currency}
            {getCartAmount()} {/* Tổng giá của tất cả sản phẩm trong giỏ hàng, đã tính khuyến mãi */}
          </p>
        </div>
        <div className="flex justify-between">
          <h5 className="h5">Shipping Fee</h5>
          <p className="font-bold">
            {getCartAmount() === 0 // Nếu giỏ hàng trống, phí vận chuyển là $0.00
              ? "$0.00"
              : `${currency}${delivery_charges}.00`} {/* Ngược lại sử dụng phí vận chuyển cố định */}
          </p>
        </div>
        <div className="flex justify-between">
          <h5 className="h5">Tax (2%)</h5>
          <p className="font-bold">
            {currency}
            {(getCartAmount() * 2) / 100} {/* Tính thuế là 2% của tổng tiền giỏ hàng */}
          </p>
        </div>
        <div className="flex justify-between text-lg font-medium mt-3">
          <h4 className="h4">Total Amount:</h4>
          <p className="bold-18">
            {currency}
            {getCartAmount() === 0
              ? "0.00"
              : getCartAmount() + // Tổng cộng cuối cùng = tổng tiền giỏ hàng + phí vận chuyển + thuế
                delivery_charges +
                (getCartAmount() * 2) / 100}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
