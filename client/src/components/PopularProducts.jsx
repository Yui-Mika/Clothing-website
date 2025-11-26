import React, { useContext, useEffect, useState } from "react";
import Title from "./Title";
import Item from "./Item";
import { ShopContext } from "../context/ShopContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const PopularProducts = () => {
  const [popularProducts, setPopularProducts] = useState([]);
  const { products } = useContext(ShopContext);

  useEffect(() => {
    const data = products.filter((item) => item.popular);
    setPopularProducts(data.slice(0, 10)); // Tăng lên 10 sản phẩm
  }, [products]);

  return (
    <section className="max-padd-container py-20 bg-gradient-to-b from-gray-50 to-white">
      {/* Title Section - Luxury Typography */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-3">
          <span className="font-semibold text-gray-900">Sản phẩm</span>
          <span className="text-gray-400 ml-2">Phổ biến</span>
        </h2>
        <p className="text-gray-500 text-sm tracking-wider uppercase mb-4">
          Khám phá bộ sưu tập quần áo và giày dép thời trang của chúng tôi
        </p>
        <div className="w-16 h-0.5 bg-gray-900 mx-auto"></div>
      </div>

      {/* Loading State - Skeleton */}
      {popularProducts.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Swiper with enhanced styling */}
          <Swiper
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            breakpoints={{
              555: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              800: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1150: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
              1350: {
                slidesPerView: 5,
                spaceBetween: 20,
              },
            }}
            modules={[Autoplay, Navigation, Pagination]}
            className="!pb-12 px-4"
          >
            {popularProducts.map((product) => (
              <SwiperSlide key={product._id}>
                <Item product={product} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10
                           w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center
                           hover:bg-gray-900 hover:text-white transition-all duration-300 
                           disabled:opacity-0 disabled:pointer-events-none">
            <FiChevronLeft className="text-xl" />
          </button>
          <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10
                           w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center
                           hover:bg-gray-900 hover:text-white transition-all duration-300
                           disabled:opacity-0 disabled:pointer-events-none">
            <FiChevronRight className="text-xl" />
          </button>
        </div>
      )}
    </section>
  );
};

export default PopularProducts;
