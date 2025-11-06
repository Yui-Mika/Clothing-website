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
  // Lấy navigate và axios từ context để sử dụng
  const { navigate, axios } = useContext(ShopContext);

  // Hàm xử lý đăng xuất
  const logout = async () => {
   try {
    // Gửi request đến API logout
    const {data} = await axios.post('/api/admin/logout')
    if(data.success){
      // Nếu thành công, hiển thị thông báo và chuyển về trang chủ
      console.log(data)
      toast.success(data.message)
      navigate('/');
    }else{
      // Nếu thất bại, hiển thị lỗi
      toast.error(data.message)
    }
   } catch (error) {
    // Xử lý lỗi nếu có
    toast.error(data.message)
   }
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
              className="bold-20 md:bold-24 uppercase font-paci lg:pl-[15%]"
            >
              Shopprr <span className="text-secondary bold-28">.</span>
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
