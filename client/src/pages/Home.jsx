// Bộ khung của Home
import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import Hero from '../components/Hero' // nhập khẩu component bằng tên Hero từ tệp Hero.jsx
import Categories from '../components/Categories' // nhập khẩu component Categories từ tệp Categories.jsx
import Features from '../components/Features' // nhập khẩu component Features từ tệp Features.jsx
import PopularProducts from '../components/PopularProducts' // nhập khẩu component PopularProducts từ tệp PopularProducts.jsx
import banner from "../assets/banner.png" // nhập khẩu hình ảnh banner từ thư mục assets
import Blog from '../components/Blog' // nhập khẩu component Blog từ tệp Blog.jsx

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    // Check for email verification status in URL
    const searchParams = new URLSearchParams(location.search);
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
      toast.success('Xác thực email thành công! Bạn có thể đăng nhập ngay.', {
        duration: 5000,
        icon: '✅'
      });
      // Clean URL
      window.history.replaceState({}, '', '/');
    } else if (verified === 'false') {
      toast.error(error || 'Xác thực email thất bại. Vui lòng thử lại.', {
        duration: 5000
      });
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, [location]);

  return (
    <>
    {/* Nội dung chính của trang chủ */}
    {/* Nó sử dụng một Fragment (<>...</>),
    là một cách để nhóm các phần tử HTML/React lại với nhau mà không cần thêm một thẻ div thừa thãi vào DOM (cây cấu trúc HTML).*/}
    <Hero />
    <Features />
    <Categories />
    <PopularProducts />
    
    {/* Promo Banner */}
    <div className="max-padd-container py-12 md:py-16">
      <div className="relative overflow-hidden rounded-2xl shadow-lg group">
        <img 
          src={banner} 
          alt="Fashion Sale Banner" 
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Optional overlay for better contrast */}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all duration-300"></div>
      </div>
    </div>
    
    <Blog />
    </>
  )
}

export default Home