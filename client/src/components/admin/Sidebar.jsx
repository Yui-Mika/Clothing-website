// Import các thư viện cần thiết
import React, { useContext } from "react";
import { Link, NavLink, Outlet } from "react-router-dom"; // Router để điều hướng
import { FaSquarePlus } from "react-icons/fa6"; // Icon thêm sản phẩm
import { FaListAlt, FaUsers, FaChartBar } from "react-icons/fa"; // Icon danh sách, khách hàng và báo cáo
import { MdFactCheck } from "react-icons/md"; // Icon đơn hàng
import { BiLogOut } from "react-icons/bi"; // Icon đăng xuất
import { ShopContext } from "../../context/ShopContext"; // Context để sử dụng axios và navigate
import toast from "react-hot-toast"; // Thư viện thông báo

const Sidebar = () => {
  // Lấy navigate, axios và logoutUser từ context để sử dụng
  const { navigate, axios, logoutUser } = useContext(ShopContext);

  // Hàm xử lý đăng xuất - Sử dụng logoutUser từ context để đảm bảo đồng bộ
  const logout = async () => {
    // Gọi logoutUser từ context - hàm này đã xử lý đầy đủ:
    // 1. Gửi request đến API logout
    // 2. Xóa cả admin_token và user_token
    // 3. Clear tất cả states (user, isAdmin, cartItems)
    // 4. Navigate về trang chủ
    // 5. Hiển thị thông báo
    await logoutUser();
  };

  // Mảng chứa các menu item của sidebar
  const navItems = [
    {
      path: "/admin", // Đường dẫn trang thêm sản phẩm
      label: "Add Item", // Nhãn hiển thị
      icon: <FaSquarePlus/>, // Icon thêm
    },
    {
      path: "/admin/list", // Đường dẫn trang danh sách sản phẩm
      label: "List", // Nhãn hiển thị
      icon: <FaListAlt/>, // Icon danh sách
    },
    {
      path: "/admin/orders", // Đường dẫn trang đơn hàng
      label: "Orders", // Nhãn hiển thị
      icon: <MdFactCheck/>, // Icon đơn hàng
    },
    {
      path: "/admin/customers", // Đường dẫn trang danh sách khách hàng
      label: "List Customer", // Nhãn hiển thị
      icon: <FaUsers/>, // Icon khách hàng
    },
    {
      path: "/admin/report", // Đường dẫn trang báo cáo thống kê
      label: "Report", // Nhãn hiển thị
      icon: <FaChartBar/>, // Icon báo cáo
    },
  ];

  return (
      <div className="mx-auto max-w-[1440px] flex flex-col sm:flex-row ">

        {/* SIDEBAR - Thanh điều hướng bên trái */}
        <div className="max-sm:flexCenter max-xs:pb-3 bg-primary pb-3 m-2 sm:min-w-[20%] sm:min-h-[97vh] rounded-xl">
          <div className="flex flex-col gap-y-6 max-sm:items-center sm:flex-col pt-4 sm:pt-14">
            {/* Logo của website */}
            <Link
              to="/admin"
              className="flex items-center justify-center sm:justify-start lg:pl-[15%] group"
            >
              <div className="flex flex-col items-center sm:items-start gap-3">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-[0.15em] uppercase relative">
                  <span className="text-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-300 hover:tracking-[0.2em]">
                    VELOURA
                  </span>
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-black to-transparent opacity-30"></span>
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/10">
                  <span className="text-[9px] md:text-[10px] text-black/70 font-bold tracking-[0.25em] uppercase">Admin Panel</span>
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse shadow-sm"></span>
                </div>
              </div>
            </Link>

            <div className="flex sm:flex-col sm:gap-x-5 gap-y-8 sm:pt-10">
              {/* Render tất cả các menu item từ mảng navItems */}
              {navItems.map((item) => (
                <NavLink
                  to={item.path} // Đường dẫn của menu
                  key={item.label} // Key unique cho mỗi item
                  end={item.path === "/admin"} // Chỉ active khi đúng path (không bao gồm sub-path)
                  className={({ isActive }) =>
                    isActive
                      ? // Khi menu đang active: thêm màu secondary và background
                        "flexStart gap-x-2 p-5 lg:pl-12 medium-15 cursor-pointer h-10 text-secondary bg-tertiary/10 max-sm:border-b-4 sm:border-r-4 border-secondary"
                      : // Khi menu không active: style mặc định
                        "flexStart gap-x-2 lg:pl-12 p-5 medium-15 cursor-pointer h-10 rounded-xl"
                  }
                >
                  {item.icon} {/* Hiển thị icon */}
                  <div className="hidden sm:flex">{item.label}</div> {/* Hiển thị label (ẩn trên mobile) */}
                </NavLink>
              ))}

              {/* Nút đăng xuất - đặt cách xa các menu khác */}
              <div className="max-sm:ml-5 sm:mt-48">
                <button
                  onClick={logout} // Gọi hàm logout khi click
                  className="flexStart gap-x-2 lg:pl-12 p-5 medium-15 cursor-pointer h-10 rounded-xl text-red-500"
                >
                  <BiLogOut className="text-lg" /> {/* Icon đăng xuất */}
                  <div className="hidden sm:flex">Logout</div> {/* Text (ẩn trên mobile) */}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Outlet để render các component con của route */}
        <Outlet />
      </div>
  );
};

export default Sidebar;
