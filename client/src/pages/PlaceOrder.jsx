/* Logic chính - xử lý việc thu thập thông tin giao hàng từ người dùng và gửi yêu cầu tạo đơn hàng lên backend
sử dụng hai phương thức thanh toán: Thanh toán khi nhận hàng (COD) hoặc Stripe (Thanh toán trực tuyến).*/
import React, { useContext, useState } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";

// Xử lý quy trình đặt hàng cuối cùng
const PlaceOrder = () => {
  const {
    navigate,
    cartItems,
    setCartItems,
    products,
    axios,
  } = useContext(ShopContext);
  const [method, setMethod] = useState("COD"); // lưu trữ phương thức thanh toán được chọn bởi người dùng (COD hoặc Stripe)

  const location = useLocation();
  const isOrderPage = location.pathname.includes("place-order");

  const [formData, setFormData] = useState({ // Lưu trữ thông tin địa chỉ giao hàng, bao gồm Tên, Email, Địa chỉ, Số điện thoại, v.v.
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  // Xử lý thay đổi form 
  /* Hàm tiêu chuẩn được sử dụng để cập nhật state formData theo thời gian thực khi người dùng nhập liệu vào các trường input. 
  Nó sử dụng thuộc tính name của input làm key và value làm giá trị mới.*/
  const onChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    setFormData((data) => ({ ...data, [name]: value }));
  };

  /* Hàm này là trung tâm của logic đặt hàng. Nó thực hiện ba bước chính: Chuẩn bị dữ liệu, Gửi yêu cầu API, và Xử lý phản hồi.*/
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    try {
      // Bước 1: Chuẩn bị orderItems (chứa thông tin chi tiết)
      let orderItems = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) { // Giỏ hàng có cấu trúc lồng nhau: { productId: { size: quantity } }
            const itemInfo = structuredClone(
              products.find((product) => product._id === items)
            );
            if (itemInfo) {
              // ... logic lấy thông tin sản phẩm từ products ...
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      // Bước 2: Chuyển đổi sang định dạng backend mong muốn (items)
      let items = orderItems.map(item => ({
        product: item._id,
        quantity: item.quantity,
        size: item.size
      }));

      // Bước 3: Gửi yêu cầu POST đến endpoint API dựa trên phương thức thanh toán đã chọn
      if (method === "COD") {
        // Place order using COD
        const { data } = await axios.post("/api/order/cod", {
            items,
            address: formData,
        });
        if (data.success) {
            toast.success(data.message);
            setCartItems({}); // Xóa giỏ hàng sau khi đặt hàng thành công
            navigate("/my-orders"); // Chuyển hướng người dùng đến trang đơn hàng của họ
        } else {
            toast.error(data.message);
        }
    } else {
        // Gửi yêu cầu POST đến endpoint /api/order/stripe. Backend sẽ tạo một phiên thanh toán Stripe và trả về một URL.
        const { data } = await axios.post("/api/order/stripe", {
            items,
            address: formData,
        });
        if (data.success) {
          // Chuyển hướng người dùng đến cổng thanh toán Stripe
           window.location.replace(data.url)
        } else {
            toast.error(data.message);
        }
        
    }
} catch (error) {
    console.log(error)
    toast.error(error.message)
}
};
/* Hàm onSubmitHandler là một quy trình đặt hàng hoàn chỉnh, từ việc ánh xạ dữ liệu giỏ hàng sang định dạng API, 
đến việc gọi endpoint đặt hàng tương ứng (COD hoặc Stripe), và cuối cùng là xử lý thành công/thất bại và cập nhật trạng thái ứng dụng. */

// giao diện người dùng cho trang Xác nhận đặt hàng/Thanh toán, bao gồm form nhập thông tin giao hàng và khối tóm tắt giỏ hàng/thanh toán.
return (
    <div className="max-padd-container py-16 pt-28 bg-primary">
      {/* Container */}
      <form onSubmit={onSubmitHandler}>
        <div className="flex flex-col xl:flex-row gap-20 xl:gap-28">
          {/* Left Side (Form) */}
          <div className="flex flex-[2] flex-col gap-3 text-[95%]">
            {/* Chứa tất cả các trường input để thu thập thông tin giao hàng từ người dùng. */}
            <Title
              title1={"Delivery"}
              title2={"Information"}
              titleStyles={"pb-5"}
            />
            {/* Các trường input cho thông tin giao hàng */}
            <div className="flex gap-3">
              <input
                onChange={onChangeHandler}
                value={formData.firstName}
                type="text"
                name="firstName"
                placeholder="First Name"
                className="ring-1 ring-slate-900/15  p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
              <input
                onChange={onChangeHandler}
                value={formData.lastName}
                type="text"
                name="lastName"
                placeholder="Last Name"
                className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
            </div>
            <input
              onChange={onChangeHandler}
              value={formData.email}
              type="text"
              name="email"
              placeholder="Email"
              className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none"
              required
            />
            <input
              onChange={onChangeHandler}
              value={formData.phone}
              type="text"
              name="phone"
              placeholder="Phone Number"
              className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none"
              required
            />
            <input
              onChange={onChangeHandler}
              value={formData.street}
              type="text"
              name="street"
              placeholder="Street"
              className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none"
              required
            />
            <div className="flex gap-3">
              <input
                onChange={onChangeHandler}
                value={formData.city}
                type="text"
                name="city"
                placeholder="City"
                className="ring-1 ring-slate-900/15  p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
              <input
                onChange={onChangeHandler}
                value={formData.state}
                type="text"
                name="state"
                placeholder="State"
                className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
            </div>
            <div className="flex gap-3">
              <input
                onChange={onChangeHandler}
                value={formData.zipcode}
                type="text"
                name="zipcode"
                placeholder="Zip Code"
                className="ring-1 ring-slate-900/15  p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
              <input
                onChange={onChangeHandler}
                value={formData.country}
                type="text"
                name="country"
                placeholder="Country"
                className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
            </div>
          </div>

          {/* Right Side (summary) */}
          <div className="flex flex-1 flex-col">
            {/* Tóm tắt đơn hàng và nút để tiếp tục đến bước tiếp theo (đặt hàng hoặc thanh toán). */}
            <div className="max-w-[360px] w-full bg-white p-5 py-10 max-md:mt-16">
              <CartTotal method={method} setMethod={setMethod} />
              {/* Nút để tiếp tục đến bước tiếp theo (đặt hàng hoặc thanh toán). */}
              {/* Nút được hiển thị khác nhau tùy thuộc vào việc người dùng đang ở trang Giỏ hàng hay trang Đặt hàng (isOrderPage). */}
              {!isOrderPage ? (
                <button
                  onClick={() => navigate("/place-order")}
                  className="btn-dark w-full mt-8"
                >
                  Proceed to Delivery
                </button>
              ) : (
                <button type="submit" className="btn-dark w-full mt-8">
                  Proceed to Order
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlaceOrder;
