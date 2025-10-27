/* component App chính, đóng vai trò là Bộ định tuyến (Router) cấp cao nhất trong ứng dụng React của bạn. 
Nó quản lý việc hiển thị các trang khác nhau, bao gồm cả giao diện người dùng (user) và giao diện quản trị (admin).*/
import React, { useContext } from 'react'
import { Route, Routes, useLocation } from "react-router-dom"
import { ShopContext } from './context/ShopContext'
import { Toaster } from "react-hot-toast"
import Home from './pages/Home'
import Header from './components/Header'
import Login from './components/Login'
import Cart from './pages/Cart'
import Collection from './pages/Collection'
import Footer from './components/Footer'
import ProductDetails from './pages/ProductDetails'
import CategoryCollection from './pages/CategoryCollection'
import Testimonial from './pages/Testimonial'
import Contact from './pages/Contact'
import PlaceOrder from './pages/PlaceOrder'
import AdminLogin from './components/admin/AdminLogin'
import Sidebar from './components/admin/Sidebar'
import List from './pages/admin/List'
import AddProduct from './pages/admin/AddProduct'
import MyOrders from './pages/MyOrders'
import Orders from './pages/admin/Orders'
import Loading from './components/Loading'
import ReCAPTCHA from "react-google-recaptcha";

// Logic Điều kiện và Cấu trúc Tổng thể
const App = () => {
  const {showUserLogin, isAdmin} = useContext(ShopContext) // Truy cập showUserLogin và isAdmin từ ShopContext để kiểm soát hiển thị.
  /* Sử dụng useLocation() và location.pathname.includes('admin') để xác định xem người dùng 
  có đang ở trong một đường dẫn admin hay không (isAdminPath).*/
  const location = useLocation();
  const isAdminPath = location.pathname.includes('admin')

  // Hiển thị điều kiện
  return (
    <main className='overflow-hidden text-tertiary'>
      {showUserLogin && <Login />} {/* Hiển thị modal đăng nhập/đăng ký người dùng nếu state showUserLogin là true. */}
      {!isAdminPath && <Header />} {/* Ẩn thanh điều hướng và chân trang khi người dùng truy cập bất kỳ đường dẫn nào có chứa /admin. */}
      <Toaster position="bottom-right"/> {/* Thiết lập hệ thống thông báo pop-up (toast notifications) cho toàn bộ ứng dụng. */}

      {/* Sử dụng component <Routes> từ react-router-dom để ánh xạ đường dẫn URL đến các component trang tương ứng. */}
      <Routes>
        {/* Định tuyến trang người dùng (Customer Routes) */}
        <Route path='/' element={<Home />}/> {/* Trang chủ */}
        <Route path='/collection' element={<Collection />}/> {/* Trang tổng hợp tất cả các sản phẩm */}
        <Route path='/collection/:category' element={<CategoryCollection />}/> {/* Trang sản phẩm lọc theo Danh mục (ví dụ: /collection/t-shirt). */}
        <Route path='/collection/:category/:id' element={<ProductDetails/>}/>  {/* Trang Chi tiết Sản phẩm cụ thể. */}
        <Route path='/testimonial' element={<Testimonial/>}/> {/* Trang lời chứng thực/ đánh giá của khách hàng */}
        <Route path='/contact' element={<Contact/>}/> {/* Trang liên hệ */}
        <Route path='/place-order' element={<PlaceOrder />}/> {/* Trang xác nhận và thanh toán đơn hàng */}
        <Route path='/my-orders' element={<MyOrders />}/> {/* Trang lịch sử Đơn hàng của tôi */}
        <Route path='/cart' element={<Cart />}/> {/* Trang giỏ hàng */}
        <Route path='/loader' element={<Loading />}/> {/* Trang Component tải (Loading) (thường dùng cho mục đích kiểm tra/demo). */}

        {/* Định tuyến Khu vực Quản trị (Admin Routes) */}
        {/* Đường dẫn /admin là đường dẫn cha, sử dụng Nested Routes và logic kiểm tra isAdmin để bảo vệ truy cập. */}
        <Route path='/admin' element={isAdmin ? <Sidebar /> : <AdminLogin />}>
            <Route index element={isAdmin ? <AddProduct /> : null}/> {/* Kiểm tra quyền admin trước khi hiển thị component */}
            <Route path='list' element={<List />}/>
            <Route path='orders' element={<Orders  />}/>
        </Route>
      </Routes>
      {!isAdminPath && <Footer />}
    </main>
  )
}
/* App đóng vai trò là Bộ não/Khung sườn (Shell) của toàn bộ giao diện người dùng (Frontend). 
quản lý toàn bộ frontend của web bằng cách quyết định cái gì (component nào) 
được hiển thị và ở đâu (đường dẫn URL nào), đồng thời cung cấp một cấu trúc bố cục nhất quán.*/

export default App