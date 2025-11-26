// chức năng tìm kiếm và hiển thị một carousel (thanh trượt) các sản phẩm liên quan (cùng danh mục) trên trang chi tiết sản phẩm.
// Đề xuất tối đa 5 sản phẩm khác cùng danh mục nhưng không phải là sản phẩm đang được xem
import React, { useContext, useEffect, useState } from "react";
import Item from "./Item";
import Title from "./Title";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
// Import Swiper styles
import "swiper/css";
// import required modules
import { Autoplay } from "swiper/modules";
import { ShopContext } from "../context/ShopContext";

// Logic tìm kiếm và hiển thị sản phẩm liên quan
const RelatedProducts = ({ product, id }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      let productsCopy = products.slice();
      productsCopy = productsCopy.filter(
        (item) => item.category === product.category && id !== item._id // lọc cùng danh mục và không phải sản phẩm hiện tại
      );
      setRelated(productsCopy.slice(0, 5)); // Lấy tối đa 5 sản phẩm liên quan
    }
  }, [products]);

  return (
    <section className="pt-16">
      {/* Hiển thị giao diện người dùng */}
      <Title
        title1={"Sản phẩm"}
        title2={"Liên quan"}
        titleStyles={"pb-10"}
      />
      {/* CONTAINER */}
      {/* Swiper Component: khung chứa toàn bộ slider */}
      <Swiper
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        // Cấu hình cách hiển thị số lượng sản phẩm trên các kích thước màn hình khác nhau
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
        className="min-h-[399px]"
      >
        {/* Lặp qua mảng related và tạo một SwiperSlide cho mỗi sản phẩm liên quan */}
        {related.map((product) => (
          <SwiperSlide key={product._id}>
            <Item product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default RelatedProducts;
