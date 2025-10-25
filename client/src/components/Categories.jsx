import React, { useContext } from "react";
import Title from "./Title";
import { categories } from "../assets/data";
import { ShopContext } from "../context/ShopContext";

const Categories = () => {

  const {navigate} = useContext(ShopContext)

  return (
    <section className="max-padd-container py-16 md:py-24">
      <Title
        title1={"Category"}
        title2={"List"}
        titleStyles={"pb-12"}
        paraStyles={"hidden"}
      />
      {/* container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {categories.map((category) => (
          <div
            key={category.name}
            onClick={()=>navigate(`/collection/${category.name.toLocaleLowerCase()}`)}
            className="group cursor-pointer"
          >
            {/* Image Container */}
            <div className="relative overflow-hidden bg-gray-100 aspect-square mb-4">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
            </div>
            
            {/* Category Name */}
            <h5 className="text-center text-sm md:text-base font-medium tracking-wide uppercase text-gray-800 group-hover:text-tertiary transition-colors duration-300">
              {category.name}
            </h5>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Categories;
