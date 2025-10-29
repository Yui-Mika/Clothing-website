import React from "react";
import { Swiper, SwiperSlide } from "swiper/react"; // 2 components import: khung chứa toàn bộ slider và từng slide
import { Autoplay, Pagination } from "swiper/modules"; // tính năng bổ sung của slider: tự động chạy và phân trang
import "swiper/css"; // Css của slider
import "swiper/css/pagination"; // Css của phân trang cho nó đẹp hơn
import { Link } from "react-router-dom"; /* Một thành phần từ thư viện React Router dùng để tạo liên kết nội bộ 
(giúp người dùng chuyển trang mà không cần tải lại toàn bộ trang web). */


// Component Hero: hàm trong React trả về nội dung giao diện người dùng
// Hiển thị một banner trượt với các slide quảng cáo khác nhau
const Hero = () => {
  const slides = [ //Mảng array thông tin của tất cả các slide mà bạn muốn hiển thị trong banner trượt.
    {
      id: 1,
      image: "/src/assets/slider1.jpg",
      brand: "PREMIUM",
      subtitle: "Luxury Fashion Collection",
      season: "AUTUMN / WINTER 2025",
    },
    {
      id: 2,
      image: "/src/assets/slider2.jpg",
      brand: "ESSENTIAL",
      subtitle: "Modern Minimalist Style",
      season: "NEW ARRIVALS",
    },
    {
      id: 3,
      image: "/src/assets/slider3.jpg",
      brand: "CLASSIC",
      subtitle: "Heritage Collection",
      season: "TIMELESS PIECES",
    },
  ];

  // Trả về giao diện người dùng của component Hero
  return (
    /* Container chính của banner trượt */
    <section className="w-full pt-24 pb-8"> 
    {/* w-full: Chiếm toàn bộ chiều rộng (width) của màn hình.
    pt-24: Tạo khoảng đệm (padding) ở trên (padding top) lớn.
    pb-8: Tạo khoảng đệm ở dưới (padding bottom). */}

      {/* Swiper Component: khung chứa toàn bộ slider */}
      <Swiper
        modules={[Autoplay, Pagination]} // Kích hoạt các tính năng tự động chạy và phân trang
        spaceBetween={0} // Khoảng cách giữa các slide
        slidesPerView={1} // Hiển thị một slide mỗi lần
        autoplay={{
          delay: 5000, // Thời gian giữa các lần chuyển slide (5 giây)
          disableOnInteraction: false, // slide vẫn tiếp tục trượt tự động ngay cả khi người dùng bấm vào nó.
        }}
        pagination={{ // Cấu hình phân trang
          clickable: true, // bấm vào các chấm phân trang để chuyển đến slide tương ứng
          bulletActiveClass: "!bg-tertiary !opacity-100 !w-8", // Lớp CSS tùy chỉnh cho chấm phân trang đang hoạt động
          bulletClass: "inline-block w-3 h-3 mx-1.5 rounded-full bg-gray-400 cursor-pointer transition-all duration-300 hover:bg-tertiary",
        }}
        loop={true} // Cho phép lặp vô hạn các slide
        className="h-[500px] md:h-[600px] w-full" // Chiều cao của slider: 500px trên màn hình nhỏ và 600px trên màn hình lớn
      >

        {/* Slide Content */}
        {/* Duyệt qua mảng slides và tạo từng slide riêng biệt */}
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            {/* Full Width Layout - Image với Text Overlay */}
            
            {/* Dùng Css của tailwind để định dạng*/}
            <div className="relative h-full w-full"> {/* Khung bao bọc nội dung */}

              {/* Background Image */}
              <img
                src={slide.image} // lấy đường dẫn ảnh từ slide.image (ví dụ: /src/assets/bg.png).
                alt={slide.brand}
                className="w-full h-full object-cover object-center"
              />
              
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/30"></div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex items-center justify-center px-8">
                <div className="text-center text-white max-w-2xl">
                  {/* Season */}
                  <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-white/80 mb-4">
                    {slide.season}
                  </p>

                  {/* Brand Name */}
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-wider mb-6">
                    {slide.brand}
                  </h1>
                  
                  {/* Subtitle */}
                  <p className="text-lg md:text-xl text-white/90 mb-10 font-light">
                    {slide.subtitle}
                  </p>
                  
                  {/* CTA Button */}
                  <Link
                    to="/collection" // Liên kết đến trang bộ sưu tập khi bấm vào nút
                    className="inline-block bg-white text-tertiary px-10 py-4 text-sm font-medium tracking-wide hover:bg-tertiary hover:text-white transition-all duration-300"
                  >
                    EXPLORE COLLECTION
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default Hero;
// câu lệnh kết thúc component Hero
// khai báo nó là thành phần chính của file này và sẵn sàng để được sử dụng ở mọi nơi khác trong ứng dụng React của bạn.