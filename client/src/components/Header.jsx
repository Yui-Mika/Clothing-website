// Phần header của trang web, hiển thị logo, thanh điều hướng, biểu tượng giỏ hàng, nút login
import { FaSearch, FaShoppingBasket, FaHeart } from "react-icons/fa";
import { FaBars, FaBarsStaggered } from "react-icons/fa6";
import userImg from "../assets/user.png"
import logo from "../assets/logo.png" // phần import logo
import { RiUserLine } from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext"; // import Context để truy cập dữ liệu và hàm từ ShopContext
import toast from "react-hot-toast"; // Import toast for notifications

const Header = () => {
  // Truy cập các giá trị và hàm từ ShopContext
  const { navigate, user, setShowUserLogin, searchQuery, setSearchQuery, getCartCount, axios, logoutUser, wishlistCount } = useContext(ShopContext);
  const [menuOpened, setMenuOpened] = useState(false); // State để theo dõi trạng thái mở/đóng của menu trên di động
  const [showSearch, setShowSearch] = useState(false); // State để theo dõi trạng thái hiển thị thanh tìm kiếm
  const [showUserMenu, setShowUserMenu] = useState(false); // State để quản lý menu user dropdown
  // kiểm tra xem người dùng có đang ở trang chủ hay không
  const location = useLocation()
  const isHomepage = location.pathname === '/';
  const isOnCollectionPage = location.pathname.endsWith('/collection') // ktra có đang ở trang danh mục sản phẩm hay không

  // Đóng menu user khi user logout (user === null)
  useEffect(() => {
    if (!user) {
      setShowUserMenu(false);
    }
  }, [user]);

  // hàm xử lý chuyển đổi trạng thái mở/đóng menu (true thành false và ngược lại)
  const toggleMenu = () => setMenuOpened((prev) => !prev);

  // Xử lý tìm kiếm - nếu có truy vấn tìm kiếm và không ở trang danh mục sản phẩm thì chuyển hướng đến trang danh mục sản phẩm
  useEffect(()=>{
    if(searchQuery.length > 0 && !isOnCollectionPage){
      navigate('/collection')
    }
  },[searchQuery])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-padd-container flexBetween py-2">
        {/* Nội dung header */}
        <Link to={"/"} className="flex items-center gap-3">
          {/* tăng kích thước logo */}
          <img src={logo} alt="Logo" className="h-14 sm:h-20" />
          {/* Hiển thị logo (src={logo}) và sử dụng <Link> để đảm bảo nhấp vào logo sẽ đưa người dùng về trang chủ (/). */}
        </Link>
        
        {/* Navbar  */}
        <Navbar
          setMenuOpened={setMenuOpened}
          containerStyles={`${
            menuOpened
              ? "flex items-start flex-col gap-y-8 fixed top-20 right-6 p-5 bg-white/95 backdrop-blur-md shadow-xl rounded-2xl w-64 ring-1 ring-gray-200 z-50" // hiển thị menu trên di động khi menuOpened là true
              : "hidden lg:flex gap-x-5 xl:gap-x-8 medium-15" // ẩn menu trên di động khi menuOpened là false
          }`}
        />
        
        <div className="flex gap-4 items-center">
        {/* Thanh tìm kiếm chỉ dành cho desktop */}
        <div className="relative hidden xl:flex">
          <div
            className={`${
              showSearch
                ? "flex items-center border border-gray-300 rounded-full bg-white px-4 py-2.5 transition-all duration-300 shadow-sm w-[300px]"
                : "hidden"
            }`}
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
              text-gray-600 hover:text-gray-900
              rounded-full hover:bg-gray-100
              transition-all duration-300
              ${showSearch ? "absolute top-0 right-0" : ""}
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
          
          {/* WISHLIST */}
          <button 
            onClick={() => {
              if (!user) {
                toast.error('Vui lòng đăng nhập để xem danh sách yêu thích');
                setShowUserLogin(true);
              } else {
                navigate('/wishlist');
              }
            }}
            className="relative w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-300 group"
          >
            <FaHeart className="text-xl text-gray-700 group-hover:text-red-500 transition-colors" />
            
            {/* Badge số lượng wishlist */}
            {user && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                {wishlistCount}
              </span>
            )}
          </button>
          
          {/* CART */}
          <button 
            onClick={()=>navigate('/cart')} 
            className="relative w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-300 group"
          >
            <FaShoppingBasket className="text-xl text-gray-700 group-hover:text-gray-900 transition-colors" />
            {getCartCount() > 0 && ( // Hiển thị số lượng sản phẩm trong giỏ hàng nếu có
              <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                {getCartCount()}
              </span>
            )}
          </button>
          
          {/* Hồ sơ người dùng - USER PROFILE */}
          {/* Phần này có logic điều kiện để hiển thị giao diện khác nhau tùy thuộc vào trạng thái user */}
          <div className="relative">
            {user ? ( // nếu user là true (người dùng đã đăng nhập)
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 hover:shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer"
              >
                <img src={userImg} alt="User" className="h-full w-full rounded-full object-cover" /> {/* hiển thị ảnh hồ sơ người dùng */}
              </div>
            ) : ( // nếu user là false (người dùng chưa đăng nhập)
              <button
                onClick={() => setShowUserLogin(true)} // mở modal đăng nhập khi nhấp vào nút Login
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 hover:shadow-lg transition-all duration-300 font-medium text-sm"
              >
                Login
                <RiUserLine className="text-lg" />
              </button>
            )}
            
            {/* DROPDOWN - phần Dropdown (thả xuống) trong khối Hồ sơ Người dùng */}
            {user && showUserMenu && (
              <ul className="bg-white p-2 w-44 border border-gray-200 rounded-xl absolute right-0 top-14 flex flex-col text-sm shadow-xl z-50">
                {/* Nội dung Dropdown */}
                <li
                  onClick={() => {
                    navigate("/profile");
                    setShowUserMenu(false);
                  }}
                  className="px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200 font-medium"
                >
                  Thông tin cá nhân
                </li>
                <li
                  onClick={() => {
                    navigate("/my-orders");
                    setShowUserMenu(false);
                  }}
                  className="px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200 font-medium"
                >
                  Đơn hàng của tôi
                </li>
                <li
                  onClick={() => {
                    logoutUser();
                    setShowUserMenu(false);
                  }}
                  className="px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-red-600 cursor-pointer transition-all duration-200 font-medium"
                >
                  Đăng xuất
                </li>
              </ul>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
