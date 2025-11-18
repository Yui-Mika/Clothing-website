// Import các thư viện cần thiết
import React, { useContext } from "react";
import { Link, NavLink, Outlet } from "react-router-dom"; // Router để điều hướng
import { FaSquarePlus } from "react-icons/fa6"; // Icon thêm sản phẩm
import { FaListAlt, FaUsers, FaChartBar, FaStar } from "react-icons/fa"; // Icon danh sách, khách hàng, báo cáo và testimonials
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
      path: "/admin/testimonials", // Đường dẫn trang quản lý testimonials
      label: "Testimonials", // Nhãn hiển thị
      icon: <FaStar/>, // Icon testimonials
    },
    {
      path: "/admin/report", // Đường dẫn trang báo cáo thống kê
      label: "Report", // Nhãn hiển thị
      icon: <FaChartBar/>, // Icon báo cáo
    },
  ];

  return (
      <div className="mx-auto max-w-[1440px] flex flex-col sm:flex-row">

        {/* SIDEBAR - Thanh điều hướng bên trái */}
        <div className="bg-white shadow-xl border border-gray-100 m-2 sm:min-w-[20%] sm:min-h-[97vh] rounded-2xl overflow-hidden">
          <div className="flex flex-col h-full">
            
            {/* Logo Header */}
            <div className="border-b border-gray-100 px-6 py-8 bg-gradient-to-br from-gray-50 to-white">
              <Link
                to="/admin"
                className="flex flex-col items-center sm:items-start gap-3 group"
              >
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-[0.15em] uppercase relative">
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent drop-shadow-sm group-hover:tracking-[0.2em] transition-all duration-300">
                    VELOURA
                  </span>
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gray-900 to-transparent opacity-20"></span>
                </h1>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 rounded-full shadow-sm">
                  <span className="text-[9px] md:text-[10px] text-white font-bold tracking-[0.2em] uppercase">Admin Panel</span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                </div>
              </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  to={item.path}
                  key={item.label}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gray-900 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="hidden sm:block">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Logout Button - Bottom */}
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              >
                <BiLogOut className="text-lg" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
            
          </div>
        </div>
        
        {/* Outlet để render các component con của route */}
        <Outlet />
      </div>
  );
};

export default Sidebar;
