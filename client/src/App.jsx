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
import Sidebar from './components/admin/Sidebar'
import List from './pages/admin/List'
import AddProduct from './pages/admin/AddProduct'
import MyOrders from './pages/MyOrders'
import Orders from './pages/admin/Orders'
import ListCustomer from './pages/admin/ListCustomer' // Import ListCustomer page
import Report from './pages/admin/Report' // Import Report page
import Testimonials from './pages/admin/Testimonials' // Import Testimonials admin page
import Loading from './components/Loading'
import Wishlist from './pages/Wishlist' // Import Wishlist page
import VerifyEmail from './pages/VerifyEmail' // Import VerifyEmail page
import Blogs from './pages/Blogs' // Import Blogs page
import BlogDetails from './pages/BlogDetails' // Import BlogDetails page

const App = () => {
  const {showUserLogin, isAdmin, navigate, setShowUserLogin} = useContext(ShopContext)
  const location = useLocation();
  const isAdminPath = location.pathname.includes('admin')
  const isVerifyPath = location.pathname.includes('verify-email')

  // Redirect về home và mở login modal nếu truy cập admin mà chưa login
  React.useEffect(() => {
    if (isAdminPath && !isAdmin) {
      navigate('/');
      setShowUserLogin(true); // Mở login modal
    }
  }, [isAdminPath, isAdmin, navigate, setShowUserLogin]);

  return (
    <main className='overflow-hidden text-tertiary'>
      {showUserLogin && <Login />}
      {!isAdminPath && !isVerifyPath && <Header />}
      <Toaster position="bottom-right"/>
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/collection' element={<Collection />}/>
        <Route path='/collection/:category' element={<CategoryCollection />}/>
        <Route path='/collection/:category/:id' element={<ProductDetails/>}/>
        <Route path='/testimonial' element={<Testimonial/>}/>
        <Route path='/contact' element={<Contact/>}/>
        <Route path='/place-order' element={<PlaceOrder />}/>
        <Route path='/my-orders' element={<MyOrders />}/>
        <Route path='/cart' element={<Cart />}/>
        <Route path='/wishlist' element={<Wishlist />}/>
        <Route path='/blogs' element={<Blogs />}/>
        <Route path='/blogs/:id' element={<BlogDetails />}/>
        <Route path='/product/:id' element={<ProductDetails />}/>
        <Route path='/verify-email' element={<VerifyEmail />}/>
        <Route path='/loader' element={<Loading />}/>
        {/* Admin Routes - Chỉ hiển thị khi đã login với role admin/staff */}
        <Route path='/admin' element={isAdmin ? <Sidebar /> : <Home />}>
            <Route index element={isAdmin ? <AddProduct /> : null}/>
            <Route path='list' element={isAdmin ? <List /> : null}/>
            <Route path='orders' element={isAdmin ? <Orders /> : null}/>
            <Route path='customers' element={isAdmin ? <ListCustomer /> : null}/>
            <Route path='testimonials' element={isAdmin ? <Testimonials /> : null}/>
            <Route path='report' element={isAdmin ? <Report /> : null}/>
        </Route>
      </Routes>
      {!isAdminPath && !isVerifyPath && <Footer />}
    </main>
  )
}

export default App