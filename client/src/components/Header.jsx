// Phần header của trang web, hiển thị logo, thanh điều hướng, biểu tượng giỏ hàng, nút login
import { FaSearch, FaShoppingBasket } from "react-icons/fa";
import { FaBars, FaBarsStaggered } from "react-icons/fa6";
import userImg from "../assets/user.png"
import logo from "../assets/logo.png" // phần import logo
import { RiUserLine } from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext"; // import Context để truy cập dữ liệu và hàm từ ShopContext

const Header = () => {
  // Truy cập các giá trị và hàm từ ShopContext
  const { navigate, user, setShowUserLogin, searchQuery, setSearchQuery, getCartCount, axios, logoutUser } = useContext(ShopContext);
  const [menuOpened, setMenuOpened] = useState(false); // State để theo dõi trạng thái mở/đóng của menu trên di động
  const [showSearch, setShowSearch] = useState(false); // State để theo dõi trạng thái hiển thị thanh tìm kiếm
  // kiểm tra xem người dùng có đang ở trang chủ hay không
  const location = useLocation()
  const isHomepage = location.pathname === '/';
  const isOnCollectionPage = location.pathname.endsWith('/collection') // ktra có đang ở trang danh mục sản phẩm hay không

  // hàm xử lý chuyển đổi trạng thái mở/đóng menu (true thành false và ngược lại)
  const toggleMenu = () => setMenuOpened((prev) => !prev);

  // Xử lý tìm kiếm - nếu có truy vấn tìm kiếm và không ở trang danh mục sản phẩm thì chuyển hướng đến trang danh mục sản phẩm
  useEffect(()=>{
    if(searchQuery.length > 0 && !isOnCollectionPage){
      navigate('/collection')
    }
  },[searchQuery])

  return (
    <div className={`${!isHomepage && "bg-gradient-to-l from-primary via-white to-primary"} absolute top-0 left-0 right-0 max-padd-container flexBetween py-2`}>
      {/* Nội dung header */}
      <Link to={"/"} className="flex items-center">
        {/* tăng kích thước logo */}
        <img src={logo} alt="Logo" className="h-16 sm:h-20" />
        {/* Hiển thị logo (src={logo}) và sử dụng <Link> để đảm bảo nhấp vào logo sẽ đưa người dùng về trang chủ (/). */}
      </Link>
      {/* Navbar  */}
      <Navbar
      setMenuOpened={setMenuOpened}
        containerStyles={`${
          menuOpened
            ? "flex items-start flex-col gap-y-8 fixed top-16 right-6 p-5 bg-white shadow-md w-52 ring-1 ring-slate-900/5 z-50" // hiển thị menu trên di động khi menuOpened là true
            : "hidden lg:flex gap-x-5 xl:gap-x-1 medium-15 p-1" // ẩn menu trên di động khi menuOpened là false
        }`}
      />
      <div className="flex gap-4 items-center">
        {/* Thanh tìm kiếm chỉ dành cho desktop */}
        <div className="relative hidden xl:flex">
          <div
            className={`${
              showSearch
                ? "flex items-center border border-gray-300 rounded-lg bg-white w-[300px] px-4 py-2 transition-all duration-300"
                : "hidden"
            } ${!isHomepage && "!bg-primary !border-gray-200"}`}
          >
            <input
              onChange={(e)=> setSearchQuery(e.target.value)} // Cập nhật searchQuery khi người dùng nhập vào ô tìm kiếm
              type="text"
              placeholder="Search products..."
              className={`bg-transparent w-full outline-none text-sm text-gray-700 placeholder:text-gray-400`}
            />
          </div>
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className={`
              flex items-center justify-center w-10 h-10
              text-gray-600 hover:text-tertiary hover:bg-gray-100
              rounded-lg transition-all duration-300
              ${showSearch ? "absolute top-0 right-0 bg-gray-100" : ""}
            `}
          >
            <FaSearch className="text-lg" />
          </button>
        </div>
        {/* BUTTONS */}
        <div className="flex-1 flex items-center justify-end gap-x-3 xs:gap-x-4">
          {/* Nút chuyển đổi menu (chỉ dành cho mobile) */}
          <button 
            onClick={toggleMenu}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
          >
            {menuOpened ? (
              <FaBarsStaggered className="text-xl text-gray-700" />
            ) : (
              <FaBars className="text-xl text-gray-700" />
            )}
          </button>
          
          {/* CART */}
          <button 
            onClick={()=>navigate('/cart')} 
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 group"
          >
            <FaShoppingBasket className="text-2xl text-gray-700 group-hover:text-tertiary transition-colors" />
            {getCartCount() > 0 && ( // Hiển thị số lượng sản phẩm trong giỏ hàng nếu có
              <span className="absolute -top-1 -right-1 bg-tertiary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {getCartCount()}
              </span>
            )}
          </button>
          
          {/* Hồ sơ người dùng - USER PROFILE */}
          {/* Phần này có logic điều kiện để hiển thị giao diện khác nhau tùy thuộc vào trạng thái user */}
          <div className="group relative">
            {user ? ( // nếu user là true (người dùng đã đăng nhập)
              <div className="p-1 hover:bg-gray-100 rounded-lg transition-all duration-300 cursor-pointer">
                <img src={userImg} alt="User" className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-200" /> {/* hiển thị ảnh hồ sơ người dùng */}
              </div>
            ) : ( // nếu user là false (người dùng chưa đăng nhập)
              <button
                onClick={() => setShowUserLogin(true)} // mở modal đăng nhập khi nhấp vào nút Login
                className="flex items-center gap-2 px-4 py-2 bg-tertiary text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm"
              >
                Login
                <RiUserLine className="text-lg" />
              </button>
            )}
            
            {/* DROPDOWN - phần Dropdown (thả xuống) trong khối Hồ sơ Người dùng */}
            {user && (
              <ul className="bg-white p-2 w-36 border border-gray-200 rounded-lg absolute right-0 top-12 hidden group-hover:flex flex-col text-sm shadow-lg z-50">
                {/* Nội dung Dropdown */}
                <li
                  onClick={() => navigate("/my-orders")}
                  className="px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 hover:text-tertiary cursor-pointer transition-all duration-200"
                >
                  My Orders
                </li>
                <li
                  onClick={logoutUser}
                  className="px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 hover:text-red-600 cursor-pointer transition-all duration-200"
                >
                  Logout
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
