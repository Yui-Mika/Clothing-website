import React, { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import { IoCloseCircleOutline } from "react-icons/io5"; // icon close
import { FaMinus, FaPlus } from "react-icons/fa6"; // icon cộng trừ
import { ShopContext } from "../context/ShopContext"; // import dữ liệu - nơi lưu trữ trạng thái giỏ hàng, danh sách sản phẩm, hàm điều hướng, v.v.
import CartTotal from "../components/CartTotal"; // import component CartTotal để hiển thị tổng giỏ hàng
import { useLocation } from "react-router-dom"; // truy cập thông tin về URL hiện tại

const Cart = () => {
  const {
    navigate,
    products,
    currency,
    cartItems,
    updateQuantity,
  } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]); // lưu trữ dữ liệu sản phẩm trong giỏ hàng

  const location = useLocation(); // lấy thông tin về URL hiện tại
  const isOrderPage = location.pathname.includes("place-order"); // kiểm tra xem người dùng có đang ở trang đặt hàng hay không


  // Hàm gọi mỗi khi products hoặc cartItems thay đổi
  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const itemId in cartItems) {
        for (const size in cartItems[itemId]) {
          if (cartItems[itemId][size] > 0) {
            tempData.push({
              _id: itemId,
              size: size,
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [products, cartItems]);

  // Quản lý số lượng
  // gọi hàm updateQuantity từ Context để cập nhật số lượng sản phẩm trong giỏ hàng
  const increment = (id, size) => { // tăng số lượng
    const currentQuantity = cartItems[id][size];
    updateQuantity(id, size, currentQuantity + 1);
  };

  // giảm số lượng
  const decrement = (id, size) => {
    const currentQuantity = cartItems[id][size];
    if (currentQuantity > 1) {
      updateQuantity(id, size, currentQuantity - 1);
    }
  };

  // kiểm tra nếu có sản phẩm trong giỏ hàng và hiển thị giao diện giỏ hàng
  return products.length > 0 && cartItems ? (
    <div className="max-padd-container py-16 pt-28 bg-primary">
      {/* nội dung giỏ hàng */}
      <div className="flex flex-col xl:flex-row gap-20 xl:gap-28">

        {/* Trong component Cart chia thành 2 phần: bên trái và bên phải */}
        {/* Left Side */}
        <div className="flex flex-[2] flex-col gap-3 text-[95%]">
          {/* Hiển thị tiêu đề Cart Overview */}
          <Title title1={"Cart"} title2={"Overview"} titleStyles={"pb-5"} />
          {/* Cart Items Container */}
          <div className="grid grid-cols-[6fr_1fr_1fr] text-base font-medium bg-white p-2">
            <h5 className="h5 text-left">Product Details</h5>
            <h5 className="h5 text-center">Subtotal</h5>
            <h5 className="h5 text-center">Action</h5>
          </div>

          {/* Lặp qua các sản phẩm ở mảng cartData trong giỏ hàng và hiển thị từng sản phẩm */}
          {cartData.map((item, i) => {
            const product = products.find( // product.find tìm sản phẩm tương ứng trong mảng products
              (product) => product._id === item._id
            );
            const quantity = cartItems[item._id][item.size]; // cartItem lấy số lượng sản phẩm theo id và size

            // Chi tiết từng sản phẩm trong giỏ hàng
            return (
              <div
                key={i}
                className="grid grid-cols-[6fr_1fr_1fr] items-center bg-white p-2"
                // Cột 1: Chi tiết sản phẩm
                // Cột 2: Tổng phụ (giá * số lượng)
                // Cột 3: Nút xóa sản phẩm khỏi giỏ hàng 
              >
                {/* Thông tin Chi tiết (Cột 1) */}
                <div className="flex items-center md:gap-6 gap-3">
                  <div className="flex bg-primary">
                    <img src={product.image[0]} alt="" className="w-20" /> {/* Ảnh sản phẩm */}
                  </div>
                  <div className="">
                    <h5 className="hidden sm:block h5 line-clamp-1"> {/* Tên sản phẩm */}
                      {product.name}
                    </h5>
                    <div className="bold-14 flexStart gap-2 mb-1"> {/* Kích thước sản phẩm */}
                      Size: <p>{item.size}</p>
                    </div>
                    <div className="flexBetween">
                      <div className="flex items-center ring-1 ring-slate-900/5 rounded-full overflow-hidden bg-primary">

                        {/* Bộ điều khiển số lượng */}
                        {/* Nút giảm số lượng */}
                        <button
                          onClick={() => decrement(item._id, item.size)}
                          className="p-1.5 bg-white text-secondary rounded-full shadow-md"
                        >
                          <FaMinus className="text-xs" /> {/* icon trừ */}
                        </button>
                        <p className="px-2">{quantity}</p>
                        {/* Nút tăng số lượng */}
                        <button
                          onClick={() => increment(item._id, item.size)}
                          className="p-1.5 bg-white text-secondary rounded-full shadow-md"
                        >
                          <FaPlus className="text-xs" /> {/* icon cộng */}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tổng phụ (Cột 2) */}
                {/* Tính và hiển thị tổng giá trị cho sản phẩm này */}
                <p className="text-center">
                  {currency}
                  {product.offerPrice * quantity} {/* tính tổng phụ: giá khuyến mãi * số lượng */}
                </p>

                {/* Nút xóa sản phẩm (Cột 3) */}
                <button
                  onClick={() => updateQuantity(item._id, item.size, 0)}
                  className="cursor-pointer mx-auto"
                >
                  <IoCloseCircleOutline className="text-xl" /> {/* icon dấu X để đóng */}
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Side - kết thúc component của Cart*/}
        {/* Hiển thị tổng tiền giỏ hàng và các nút chuyển trang quan trọng (Thanh toán/ Đặt hàng) */}
        <div className="flex-1 flex-col">
          <div className="max-w-[360px] w-full bg-white p-5 py-10 max-md:mt-16">


            {/* Component CartTotal - Tổng giỏ hàng */}
            {/* Gọi component CartTotal để hiển thị tổng giỏ hàng */}
            <CartTotal />

            {/* Nút chuyển đến trang đặt hàng hoặc tiến hành đặt hàng */}
            {!isOrderPage ? ( //quyết định nên hiển thị nút nào, check xem ng dùng có đang ở trang Place Order hay là ở trang Cart
              // Nếu false thì hiển thị nút "Proceed to Delivery"
              <button
                onClick={() => navigate("/place-order")} /* Khi nhấn, nó gọi hàm Maps
                để chuyển hướng người dùng đến URL /place-order (Trang thanh toán/đặt hàng). */
                className="btn-dark w-full mt-8"
              >
                Proceed to Delivery
              </button>
            ) : ( // Nếu true thì hiển thị nút "Proceed to Order"
              <button type="submit" className="btn-dark w-full mt-8">
                Proceed to Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;
  // Phần này liên quan đến câu lệnh kiểm tra điều kiện ở đầu (return products.length > 0 && cartItems ? (...) : null;).
  /* Nếu điều kiện ở đầu không được thỏa mãn (ví dụ: dữ liệu sản phẩm chưa tải hoặc giỏ hàng trống), 
  component Cart sẽ trả về null và không hiển thị gì cả, tránh lỗi và giao diện trống. */
};

export default Cart;
