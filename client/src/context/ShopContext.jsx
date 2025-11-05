// Component quan trọng cung cấp dữ liệu và chức năng liên quan đến cửa hàng (shop) cho toàn bộ ứng dụng React thông qua Context API.
// Quản lý trạng thái toàn cục (global state) của cửa hàng, bao gồm dữ liệu sản phẩm, giỏ hàng, thông tin người dùng và các hàm xử lý dữ liệu.

/* Tạo ra một "kho chứa dữ liệu" có tên là ShopContext để bất kỳ component nào trong ứng dụng (mà nằm trong phạm vi của nó) 
đều có thể dễ dàng truy cập và thay đổi dữ liệu (như sản phẩm, giỏ hàng, người dùng) mà không cần truyền prop qua lại. */

// Import các thư viện và công cụ cần thiết
import React, { createContext, useEffect, useState } from "react"; //Các công cụ cơ bản để tạo Context, quản lý vòng đời và trạng thái.
import { useNavigate } from "react-router-dom"; // Dùng để điều hướng giữa các trang trong ứng dụng React.
import toast from "react-hot-toast"; // Thư viện để hiển thị các thông báo nhỏ (notification) ở góc màn hình.
import axios from "axios"; //Thư viện để thực hiện các yêu cầu HTTP (gọi API) đến máy chủ (backend).


// Cấu hình API với axios
axios.defaults.withCredentials = true; /*Cấu hình Axios để gửi cookies cùng với các yêu cầu (request) API. 
Điều này thường cần thiết để duy trì phiên đăng nhập và xác thực người dùng.*/
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL; /*Đặt URL cơ sở (base URL) cho tất cả các yêu cầu API. 
Nó lấy giá trị từ một biến môi trường (VITE_BACKEND_URL) để dễ dàng chuyển đổi giữa môi trường phát triển và sản xuất.*/


// Tạo đối tượng Context để các component con có thể truy cập dữ liệu và hàm từ đây
export const ShopContext = createContext();

// Đây là nơi chứa toàn bộ logic và trạng thái liên quan đến cửa hàng
const ShopContextProvider = ({ children }) => {
  const navigate = useNavigate(); // Hàm điều hướng giữa các trang
  const currency = import.meta.env.VITE_CURRENCY; // Đơn vị tiền tệ lấy từ biến môi trường
  const delivery_charges = 10; // Phí vận chuyển cố định là $10
  const [showUserLogin, setShowUserLogin] = useState(false); // State kiểm soát việc hiển thị/ẩn modal đăng nhập của người dùng.
  const [products, setProducts] = useState([]); // State lưu trữ tất cả sản phẩm từ backend
  const [categories, setCategories] = useState([]); // State lưu trữ tất cả categories từ backend
  const [user, setUser] = useState(null); // State lưu trữ thông tin người dùng đã đăng nhập
  const [isAdmin, setIsAdmin] = useState(false); // State kiểm tra xem người dùng hiện tại có phải là admin hay không
  const [cartItems, setCartItems] = useState({}); // State lưu trữ dữ liệu giỏ hàng của người dùng
  const [searchQuery, setSearchQuery] = useState(""); //State lưu trữ chuỗi tìm kiếm hiện tại của người dùng.

  // Hàm tải sản phẩm từ backend (API Call)
  // Gửi yêu cầu GET đến endpoint /api/product/list để lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/list"); // Gọi API để lấy danh sách sản phẩm
      if (data.success) { // Nếu thành công, cập nhật state products với dữ liệu nhận được
        setProducts(data.products);
      } else { // Nếu thất bại, hiển thị thông báo lỗi
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Hàm tải categories từ backend (API Call)
  // Gửi yêu cầu GET đến endpoint /api/category/list để lấy danh sách categories
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/category/list"); // Gọi API để lấy danh sách categories
      if (data.success) { // Nếu thành công, cập nhật state categories với dữ liệu nhận được
        setCategories(data.categories);
      } else { // Nếu thất bại, hiển thị thông báo lỗi
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Không hiển thị toast error để tránh làm phiền user nếu categories không quan trọng lắm
    }
  };

  // Xử lý xác thực người dùng, admin và chức năng thêm giỏ hàng khi ứng dụng khởi động
  // Kiểm tra trạng thái người dùng có đăng nhập hay không và xử lý việc đăng xuất
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/is-auth"); // Gọi API để kiểm tra xác thực người dùng
      if (data.success) { // Nếu người dùng đã đăng nhập, cập nhật state user và giỏ hàng
        setUser(data.user);
        setCartItems(data.user.cartData);
      } else {
        setUser(null); // xử lý khi ko đăng nhập
        setCartItems({});
      }
    } catch {
      setUser(null); // xử lý khi bị lỗi
      setCartItems({});
    }
  };

  // Kiểm tra trạng thái admin
  // Gọi API để kiểm tra xem người dùng hiện tại có phải là admin hay không
  const fetchAdmin = async () => {
    try {
      const { data } = await axios.get("/api/admin/is-auth"); // Gọi API để kiểm tra xác thực admin
      setIsAdmin(data.success); // nếu thành công, cập nhật state isAdmin
    } catch {
      setIsAdmin(false);
    }
  };

  // Đăng xuất người dùng
  // Xóa phiên đăng nhập của người dùng và giỏ hàng
  const logoutUser = async () => {
    try {
      const { data } = await axios.post("/api/user/logout"); // Gửi yêu cầu POST đến endpoint /api/user/logout để đăng xuất
      if (data.success) { /*Nếu thành công, hiển thị thông báo đặt state user về null,
        đặt cartItems về rỗng, và chuyển hướng người dùng về trang chủ (/). */
        toast.success(data.message);
        setUser(null); // Clear user state
        setIsAdmin(false); // Clear admin state
        setCartItems({}); // Clear cart
        navigate("/"); // Chuyển về trang chủ
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      // Vẫn clear state ngay cả khi có lỗi
      setUser(null);
      setIsAdmin(false);
      setCartItems({});
      navigate("/");
    }
  };

  // Xử lý sau khi đăng nhập thành công
  const handleLoginSuccess = async () => {
    await fetchUser(); // Tải lại thông tin người dùng và giỏ hàng từ server
    
    // Kiểm tra role của user để chuyển hướng đúng trang
    try {
      const { data } = await axios.get("/api/user/is-auth");
      if (data.success && data.user) {
        const userRole = data.user.role;
        
        // Nếu là admin hoặc staff, chuyển đến trang danh sách sản phẩm admin
        if (userRole === "admin" || userRole === "staff") {
          navigate("/admin/list"); // Chuyển đến trang danh sách sản phẩm trong admin panel
        } else {
          // Nếu là customer, chuyển về trang chủ
          navigate("/");
        }
      } else {
        navigate("/"); // Mặc định về trang chủ nếu không lấy được thông tin
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      navigate("/"); // Mặc định về trang chủ nếu có lỗi
    }
  };

  // Logic thêm vào giỏ hàng
  // Hàm này thực hiện hai tác vụ: cập nhật giỏ hàng cục bộ và gửi yêu cầu đến backend để đồng bộ hóa giỏ hàng trên server.
  const addToCart = async (itemId, size) => {
    if (!size) return toast.error("Please select size first"); // Kiểm tra nếu chưa chọn size thì hiển thị thông báo lỗi
    let cartData = structuredClone(cartItems); // Tạo bản sao sâu (deep clone) của cartItems để tránh thay đổi trực tiếp state
    cartData[itemId] = cartData[itemId] || {}; // Nếu sản phẩm chưa có trong giỏ hàng, khởi tạo nó dưới dạng một đối tượng rỗng
    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1; // Tăng số lượng sản phẩm theo size đã chọn
    setCartItems(cartData); // Cập nhật state cartItems với dữ liệu giỏ hàng mới

    // Nếu người dùng đã đăng nhập, gửi yêu cầu đến backend để cập nhật giỏ hàng trên server
    if (user) {
      try {
        const { data } = await axios.post("/api/cart/add", { itemId, size }); // Gọi API POST để lưu thay đổi giỏ hàng vào cơ sở dữ liệu của người dùng
        data.success ? toast.success(data.message) : toast.error(data.message); // Hiển thị thông báo thành công hoặc lỗi dựa trên phản hồi từ server
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Hàm quản lý việc cập nhật số lượng sản phẩm trong giỏ hàng
  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems); // Tạo bản sao sâu (deep clone) của cartItems để tránh thay đổi trực tiếp state
    cartData[itemId][size] = quantity; // Gán giá trị quantity mới cho sản phẩm và size tương ứng
    setCartItems(cartData); // Cập nhật state cartItems với dữ liệu giỏ hàng mới


    // Nếu người dùng đã đăng nhập, gửi yêu cầu đến backend để cập nhật giỏ hàng trên server  
    if (user) {
      try {
        const { data } = await axios.post("/api/cart/update", { itemId, size, quantity });
        data.success ? toast.success(data.message) : toast.error(data.message);
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Lấy tổng số lượng sản phẩm 
  const getCartCount = () => { 
    let count = 0;
    for (const itemId in cartItems) { /* Hàm lặp qua cấu trúc lồng nhau của cartItems (ID sản phẩm -> Kích cỡ) 
      và cộng dồn số lượng của từng mặt hàng vào biến count. */
      for (const size in cartItems[itemId]) {
        count += cartItems[itemId][size];
      }
    }
    return count;
  };

  // Lấy tổng giá trị giỏ hàng
  const getCartAmount = () => {
    let total = 0;
    for (const itemId in cartItems) { // lặp qua từng itemId
      const product = products.find((p) => p._id === itemId); // Tìm sản phẩm tương ứng trong mảng products dựa trên itemId để lấy giá khuyến mãi
      if (!product) continue;
      for (const size in cartItems[itemId]) {
        total += product.offerPrice * cartItems[itemId][size];
      }
    }
    return total;
  };

  // Tải dữ liệu ban đầu cần thiết cho ứng dụng khi component được render lần đầu tiên.
  useEffect(() => {
    fetchUser(); // Kiểm tra và tải thông tin người dùng đã đăng nhập
    fetchProducts(); // Tải danh sách sản phẩm từ backend
    fetchCategories(); // Tải danh sách categories từ backend
    fetchAdmin(); // Kiểm tra trạng thái admin
  }, []); // Chỉ chạy một lần khi component được mount

  // Đối tượng value chứa tất cả dữ liệu và hàm sẽ được cung cấp cho các component con thông qua Context
  // Bất kỳ component nào sử dụng useContext(ShopContext) đều có thể truy cập bất kỳ thuộc tính nào trong đối tượng value này.
  const value = {
    navigate,
    fetchProducts,
    fetchCategories,
    showUserLogin,
    setShowUserLogin,
    axios,
    currency,
    delivery_charges,
    products,
    categories,
    user,
    isAdmin,
    setIsAdmin,
    cartItems,
    setCartItems,
    searchQuery,
    setSearchQuery,
    addToCart,
    updateQuantity,
    getCartCount,
    getCartAmount,
    logoutUser,
    handleLoginSuccess, // <--- call this after login
  };

  // Render Component
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
/*biến nó thành trung tâm điều hành dữ liệu của toàn bộ ứng dụng thương mại điện tử bằng cách:
 cung cấp các công cụ tính toán giỏ hàng, thực hiện việc tải dữ liệu khởi tạo, và công khai toàn bộ state/hàm cần thiết qua đối tượng value. */

export default ShopContextProvider;
