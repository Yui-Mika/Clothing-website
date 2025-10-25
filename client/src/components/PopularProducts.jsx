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
  const [popularProducts, setPopularProducts] = useState([]);
  const { products } = useContext(ShopContext);

  useEffect(() => {
    const data = products.filter((item) => item.popular);
    setPopularProducts(data.slice(0, 7));
  }, [products]);
  return (
    <section className="max-padd-container py-16">
      <Title
        title1={"Popular"}
        title2={"Products"}
        titleStyles={"pb-10"}
        paraStyles={"!block"}
      />
      {/* CONTAINER */}
      <Swiper
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
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
