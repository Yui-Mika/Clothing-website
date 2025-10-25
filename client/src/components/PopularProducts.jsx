import React, { useContext, useEffect, useState } from "react";
import Title from "./Title";
import Item from "./Item";
import { ShopContext } from "../context/ShopContext";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
// Import Swiper styles
import "swiper/css";
// import required modules
import { Autoplay } from "swiper/modules";


const PopularProducts = () => {
  const [popularProducts, setPopularProducts] = useState([]); // State để lưu trữ các sản phẩm phổ biến
  const { products } = useContext(ShopContext); // Lấy ra tất cả sản phẩm products từ Context

  // Lọc các sản phẩm phổ biến khi products thay đổi
  useEffect(() => {
    const data = products.filter((item) => item.popular); // Lọc các sản phẩm có thuộc tính popular là true
    setPopularProducts(data.slice(0, 7)); // lấy tối đa 7 sản phẩm phổ biến
  }, [products]); // Chạy lại khi products thay đổi
  return (
    <section className="max-padd-container py-16">
      <Title
        title1={"Popular"}
        title2={"Products"}
        titleStyles={"pb-10"}
        paraStyles={"!block"}
      />
      {/* CONTAINER */}
      {/* Swiper Component: khung chứa toàn bộ slider */}
      <Swiper
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        // Cấu hình responsive cho slider 
        // tùy kích thước, ví dụ: 555px thì hiển thị 2 slide, 800px thì hiển thị 3 slide, ...
        breakpoints={{
          555: {
            slidesPerView: 2,
            spaceBetween: 10,
          },
          800: {
            slidesPerView: 3,
            spaceBetween: 10,
          },
          1150: {
            slidesPerView: 4,
            spaceBetween: 10,
          },
          1350: {
            slidesPerView: 5,
            spaceBetween: 10,
          },
        }}
        modules={[Autoplay]}
        className="min-h-[399px]" // Đặt chiều cao tối thiểu cho slider để tránh nhảy khi tải dữ liệu
      >
        {/* Lặp qua 7 sản phẩm phổ biến và tạo một SwiperSlide cho mỗi sản phẩm */}
        {popularProducts.map((product) => (
          <SwiperSlide key={product._id}>
            <Item product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default PopularProducts;
