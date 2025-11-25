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

// Cấu hình axios interceptor để tự động gửi JWT token trong mọi request
axios.interceptors.request.use(
  (config) => {
    // Đảm bảo headers object luôn tồn tại
    if (!config.headers) {
      config.headers = {};
    }
    
    // Lấy tokens từ localStorage
    const adminToken = localStorage.getItem('admin_token');
    const userToken = localStorage.getItem('user_token');
    
    // Debug: Log URL để kiểm tra
    console.log('🔧 Axios request URL:', config.url);
    console.log('🔧 Headers before:', JSON.stringify(config.headers));
    
    // Xác định loại route dựa trên token có sẵn
    // Nếu có admin_token → coi như admin route
    // Nếu chỉ có user_token → user route
    const url = config.url || '';
    const isAdminLoggedIn = !!adminToken;
    const isUserLoggedIn = !!userToken;
    
    // Debug: Log route type
    console.log('🔧 isAdminLoggedIn:', isAdminLoggedIn);
    console.log('🔧 adminToken:', adminToken ? 'exists' : 'null');
    console.log('🔧 userToken:', userToken ? 'exists' : 'null');
    
    // Nếu admin đã login, gửi admin token cho TẤT CẢ các route
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      console.log('✅ Sending admin token (admin logged in)');
    }
    // Nếu chỉ có user token, gửi user token
    else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
      console.log('✅ Sending user token (user logged in)');
    } else {
      console.log('⚠️ No token sent - no user logged in');
    }
    
    // Debug: Log headers sau khi set
    console.log('🔧 Headers after:', JSON.stringify(config.headers));
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cấu hình response interceptor để xử lý lỗi 401 (token hết hạn)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 Unauthorized (token hết hạn hoặc invalid)
    if (error.response?.status === 401) {
      // Nếu đang ở admin routes
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('user_token');
        window.location.href = '/'; // Redirect về trang chủ, login modal sẽ tự mở
      } 
      // Nếu đang ở user routes (không phải admin)
      else {
        localStorage.removeItem('user_token');
        localStorage.removeItem('admin_token');
        // Reload page để trigger login modal
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);


// Tạo đối tượng Context để các component con có thể truy cập dữ liệu và hàm từ đây
export const ShopContext = createContext();

// Đây là nơi chứa toàn bộ logic và trạng thái liên quan đến cửa hàng
const ShopContextProvider = ({ children }) => {
  const navigate = useNavigate(); // Hàm điều hướng giữa các trang
  const currency = '₫'; // Đơn vị tiền tệ Việt Nam
  const delivery_charges = 10; // Phí vận chuyển cố định là $10 (deprecated - sẽ dùng từ settings)
  
  // Function format số tiền theo chuẩn Việt Nam (1.000.000₫)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
  };
  const [showUserLogin, setShowUserLogin] = useState(false); // State kiểm soát việc hiển thị/ẩn modal đăng nhập của người dùng.
  const [products, setProducts] = useState([]); // State lưu trữ tất cả sản phẩm từ backend
  const [categories, setCategories] = useState([]); // State lưu trữ tất cả categories từ backend
  const [user, setUser] = useState(null); // State lưu trữ thông tin người dùng đã đăng nhập
  const [isAdmin, setIsAdmin] = useState(false); // State kiểm tra xem người dùng hiện tại có phải là admin hay không
  const [cartItems, setCartItems] = useState({}); // State lưu trữ dữ liệu giỏ hàng của người dùng
  const [searchQuery, setSearchQuery] = useState(""); //State lưu trữ chuỗi tìm kiếm hiện tại của người dùng.
  
  // ============================================================================
  // SETTINGS STATE - Quản lý shipping fee và tax rate từ backend
  // ============================================================================
  const [currentSettings, setCurrentSettings] = useState({
    year: new Date().getFullYear(),
    shippingFee: 10, // Default fallback
    taxRate: 0.02, // Default 2%
    isActive: true
  });
  
  // ============================================================================
  // WISHLIST STATE - Quản lý wishlist của user
  // ============================================================================
  const [wishlistCount, setWishlistCount] = useState(0); // Số lượng sản phẩm trong wishlist (hiển thị badge)
  const [wishlistProducts, setWishlistProducts] = useState([]); // Danh sách sản phẩm trong wishlist (dùng trong Wishlist page)

  // Hàm fetch settings từ backend
  const fetchSettings = async () => {
    try {
      const { data } = await axios.get("/api/settings/current");
      if (data) {
        setCurrentSettings({
          year: data.year,
          shippingFee: data.shippingFee,
          taxRate: data.taxRate,
          isActive: data.isActive
        });
        console.log("✅ Settings loaded:", data);
      }
    } catch (error) {
      console.error("❌ Error fetching settings:", error);
      // Giữ giá trị mặc định nếu fetch thất bại
      toast.error("Không thể tải cài đặt phí, sử dụng mặc định");
    }
  };

  // Helper functions để lấy fees từ settings
  const getShippingFee = () => {
    return currentSettings.shippingFee || 10;
  };

  const getTaxRate = () => {
    return currentSettings.taxRate || 0.02;
  };

  // Hàm tải sản phẩm từ backend (API Call)
  // Gửi yêu cầu GET đến endpoint /api/product/list để lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/list"); // Gọi API để lấy danh sách sản phẩm
      if (data.success) { // Nếu thành công, cập nhật state products với dữ liệu nhận được
        // Lọc chỉ hiển thị sản phẩm active (isActive !== false) cho người dùng
        // Admin vẫn thấy tất cả sản phẩm vì họ fetch trực tiếp từ API trong admin pages
        const activeProducts = data.products.filter(product => product.isActive !== false);
        setProducts(activeProducts);
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
      console.log("🔍 fetchUser response:", data); // Debug log
      console.log("🔍 data.success:", data.success, typeof data.success); // Debug success field
      console.log("🔍 data.user:", data.user); // Debug user field
      if (data.success) { // Nếu người dùng đã đăng nhập, cập nhật state user và giỏ hàng
        console.log("✅ User logged in:", data.user); // Debug log
        setUser(data.user);
        setCartItems(data.user.cartData);
        
        // Set isAdmin dựa trên role
        const userRole = data.user.role;
        setIsAdmin(userRole === 'admin' || userRole === 'staff');
        console.log("✅ isAdmin set to:", userRole === 'admin' || userRole === 'staff'); // Debug log
      } else {
        console.log("❌ User not logged in - data.success is:", data.success); // Debug log
        setUser(null); // xử lý khi ko đăng nhập
        setCartItems({});
        setIsAdmin(false); // Clear admin state
      }
    } catch (error) {
      console.log("⚠️ fetchUser error:", error); // Debug log
      setUser(null); // xử lý khi bị lỗi
      setCartItems({});
      setIsAdmin(false); // Clear admin state
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
        // Xóa cả 2 tokens khỏi localStorage
        localStorage.removeItem('user_token');
        localStorage.removeItem('admin_token');
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
      localStorage.removeItem('user_token');
      localStorage.removeItem('admin_token');
      setUser(null);
      setIsAdmin(false);
      setCartItems({});
      navigate("/");
    }
  };

  // ============================================================================
  // WISHLIST FUNCTIONS - Quản lý wishlist
  // ============================================================================
  
  // Fetch wishlist count - Lấy số lượng sản phẩm trong wishlist
  // Gọi khi user login để hiển thị badge số lượng
  const fetchWishlistCount = async () => {
    try {
      const { data } = await axios.get('/api/wishlist/count');
      if (data.success) {
        setWishlistCount(data.count);
      }
    } catch (error) {
      console.log('Error fetching wishlist count:', error);
      // Không hiển thị toast để không làm phiền user
    }
  };

  // Fetch full wishlist - Lấy toàn bộ sản phẩm trong wishlist
  // Gọi trong Wishlist page để hiển thị danh sách
  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get('/api/wishlist');
      if (data.success) {
        setWishlistProducts(data.products);
        setWishlistCount(data.count);
      }
    } catch (error) {
      console.log('Error fetching wishlist:', error);
      toast.error('Không thể tải danh sách yêu thích');
    }
  };

  // Add to wishlist - Thêm sản phẩm vào wishlist
  const addToWishlist = async (productId) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào yêu thích');
      setShowUserLogin(true);
      return;
    }

    try {
      const { data } = await axios.post('/api/wishlist/add', { productId });
      if (data.success) {
        setWishlistCount(data.count);
        toast.success(data.message || 'Đã thêm vào danh sách yêu thích!');
        return true;
      } else {
        toast.error(data.message || 'Sản phẩm đã có trong danh sách yêu thích');
        return false;
      }
    } catch (error) {
      console.log('Error adding to wishlist:', error);
      toast.error('Không thể thêm vào danh sách yêu thích');
      return false;
    }
  };

  // Remove from wishlist - Xóa sản phẩm khỏi wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const { data } = await axios.delete('/api/wishlist/remove', { 
        data: { productId } 
      });
      if (data.success) {
        setWishlistCount(data.count);
        setWishlistProducts(prev => prev.filter(p => p._id !== productId));
        toast.success(data.message || 'Đã xóa khỏi danh sách yêu thích');
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      console.log('Error removing from wishlist:', error);
      toast.error('Không thể xóa khỏi danh sách yêu thích');
      return false;
    }
  };

  // Check if product in wishlist - Kiểm tra sản phẩm có trong wishlist
  // Dùng để hiển thị trạng thái button wishlist (filled/outline)
  const checkInWishlist = async (productId) => {
    if (!user) return false;
    
    try {
      const { data } = await axios.get(`/api/wishlist/check/${productId}`);
      return data.inWishlist || false;
    } catch (error) {
      console.log('Error checking wishlist:', error);
      return false;
    }
  };

  // Clear wishlist - Xóa toàn bộ wishlist
  const clearWishlist = async () => {
    try {
      const { data } = await axios.delete('/api/wishlist/clear');
      if (data.success) {
        setWishlistCount(0);
        setWishlistProducts([]);
        toast.success('Đã xóa toàn bộ danh sách yêu thích');
      }
    } catch (error) {
      console.log('Error clearing wishlist:', error);
      toast.error('Không thể xóa danh sách yêu thích');
    }
  };

  // Xử lý sau khi đăng nhập thành công
  // Chỉ fetch data, không navigate - để Login.jsx xử lý navigation
  const handleLoginSuccess = async () => {
    await fetchUser(); // Tải lại thông tin người dùng và giỏ hàng từ server
    await fetchWishlistCount(); // Tải số lượng wishlist sau khi login
    
    // Trả về role của user để Login.jsx xử lý navigation
    try {
      const { data } = await axios.get("/api/user/is-auth");
      if (data.success && data.user) {
        return data.user.role; // Trả về role: admin, staff, hoặc customer
      }
      return null;
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  // Logic thêm vào giỏ hàng
  // Hàm này thực hiện hai tác vụ: cập nhật giỏ hàng cục bộ và gửi yêu cầu đến backend để đồng bộ hóa giỏ hàng trên server.
  const addToCart = async (itemId, size) => {
    // BƯỚC 1: Kiểm tra size
    if (!size) {
      return toast.error("Vui lòng chọn kích cỡ trước");
    }

    // BƯỚC 2: Kiểm tra đăng nhập TRƯỚC KHI thêm vào giỏ hàng
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      setShowUserLogin(true); // Hiển thị modal login
      return;
    }

    // BƯỚC 3: Thêm vào giỏ hàng local
    let cartData = structuredClone(cartItems);
    cartData[itemId] = cartData[itemId] || {};
    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    setCartItems(cartData);

    // BƯỚC 4: Đồng bộ với backend
    try {
      const { data } = await axios.post("/api/cart/add", { itemId, size });
      if (data.success) {
        toast.success(data.message || "Đã thêm sản phẩm vào giỏ hàng thành công");
      } else {
        toast.error(data.message || "Không thể thêm sản phẩm");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi thêm vào giỏ hàng");
      // Rollback nếu lỗi
      let rollbackCart = structuredClone(cartItems);
      setCartItems(rollbackCart);
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
    fetchSettings(); // Tải settings (shipping fee, tax rate) từ backend
    fetchUser(); // Kiểm tra và tải thông tin người dùng đã đăng nhập (bao gồm cả isAdmin)
    fetchProducts(); // Tải danh sách sản phẩm từ backend
    fetchCategories(); // Tải danh sách categories từ backend
  }, []); // Chỉ chạy một lần khi component được mount

  // Load wishlist count khi user đăng nhập hoặc logout
  useEffect(() => {
    if (user) {
      fetchWishlistCount(); // Tải số lượng wishlist khi user đã login
    } else {
      setWishlistCount(0); // Reset wishlist count khi logout
      setWishlistProducts([]); // Clear wishlist products
    }
  }, [user]); // Chạy lại khi user state thay đổi

  // ============================================================================
  // ORDER STATUS TRANSLATION - Dịch trạng thái đơn hàng sang tiếng Việt
  // ============================================================================
  const statusTranslations = {
    "Order Placed": "Đã đặt hàng",
    "Processing": "Đang xử lý",
    "Shipped": "Đang giao hàng",
    "Delivered": "Đã giao hàng",
    "Cancelled": "Đã hủy"
  };

  // Hàm dịch trạng thái đơn hàng từ tiếng Anh sang tiếng Việt
  const translateStatus = (status) => {
    return statusTranslations[status] || status; // Trả về bản dịch hoặc giữ nguyên nếu không tìm thấy
  };

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
    formatCurrency,
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
    // Settings state & functions
    currentSettings,
    fetchSettings,
    getShippingFee,
    getTaxRate,
    // Wishlist functions & state
    wishlistCount,
    wishlistProducts,
    fetchWishlist,
    fetchWishlistCount,
    addToWishlist,
    removeFromWishlist,
    checkInWishlist,
    clearWishlist,
    // Order status translation
    translateStatus,
  };

  // Render Component
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
/*biến nó thành trung tâm điều hành dữ liệu của toàn bộ ứng dụng thương mại điện tử bằng cách:
 cung cấp các công cụ tính toán giỏ hàng, thực hiện việc tải dữ liệu khởi tạo, và công khai toàn bộ state/hàm cần thiết qua đối tượng value. */

export default ShopContextProvider;
