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
  // getShippingFee: hàm lấy phí vận chuyển từ settings
  // getTaxRate: hàm lấy tax rate từ settings
  const { currency, formatCurrency, getCartAmount, getCartCount, getShippingFee, getTaxRate } = useContext(ShopContext);
  
  // Lấy thông tin về URL hiện tại để xác định xem người dùng có đang ở trang đặt hàng hay không
  const location = useLocation();
  const isOrderPage = location.pathname.includes("place-order");

  return (
    <div>
      <h3 className="bold-22">
        Tóm tắt đơn hàng{" "} {/* Hiển thị tiêu đề "Tóm tắt đơn hàng" */}
        <span className="bold-14 text-secondary">({getCartCount()} sản phẩm)</span> {/* Hiển thị số lượng mặt hàng trong giỏ hàng mà 
        ng dùng đã thêm */}
      </h3>
      <hr className="border-gray-300 my-5" />

      {/* PAYMENT METHOD */}
      {/* Chỉ hiển thị phần chọn phương thức thanh toán khi người dùng ở trang đặt hàng/thanh toán */}
      {isOrderPage && (
        <div className="mb-6">
          <div className="my-6">
            <h4 className="h4 mb-5">
              Phương thức <span>thanh toán</span>
            </h4>
            <div className="flex gap-3 flex-wrap">
              <div
                onClick={() => setMethod("COD")}
                className={`${
                  method === "COD" ? "btn-secondary" : "btn-light" // Kiểm tra nếu phương thức hiện tại là "COD" để áp dụng kiểu nút tương ứng
                } !py-1 text-xs cursor-pointer`}
              >
                Tiền mặt khi nhận hàng
              </div>
              <div
                onClick={() => setMethod("stripe")} // Như trên, stripe ở đây là phương thức thanh toán trực tuyến
                className={`${
                  method === "stripe" ? "btn-secondary" : "btn-light"
                } !py-1 text-xs cursor-pointer`}
              >
                Stripe
              </div>
              <div
                onClick={() => setMethod("vnpay")}
                className={`${
                  method === "vnpay" ? "btn-secondary" : "btn-light"
                } !py-1 text-xs cursor-pointer`}
              >
                VNPay
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
          <h5 className="h5">Giá sản phẩm</h5>
          <p className="font-bold">
            {formatCurrency(getCartAmount())}
          </p>
        </div>
        <div className="flex justify-between">
          <h5 className="h5">Phí vận chuyển</h5>
          <p className="font-bold">
            {getCartAmount() === 0
              ? "0₫"
              : formatCurrency(getShippingFee())}
          </p>
        </div>
        <div className="flex justify-between">
          <h5 className="h5">Thuế ({(getTaxRate() * 100).toFixed(0)}%)</h5>
          <p className="font-bold">
            {formatCurrency(getCartAmount() * getTaxRate())}
          </p>
        </div>
        <div className="flex justify-between text-lg font-medium mt-3">
          <h4 className="h4">Tổng cộng:</h4>
          <p className="bold-18">
            {getCartAmount() === 0
              ? "0₫"
              : formatCurrency(getCartAmount() + getShippingFee() + (getCartAmount() * getTaxRate()))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
