import React from "react";
import Title from "./Title";
import { blogs } from "../assets/data";

const Blog = () => {
  return (
    <section className="max-padd-container py-16 md:py-24">
      <Title
        title1={"Our Expert"}
        title2={"Blog"}
        titleStyles={"pb-12"}
        paraStyles={"!block"}
        para={"Stay ahead of fashion trends with styling tips, product reviews, and expert advice helping you shop smarter and dress better."}
      />

      {/* Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {blogs.map((blog) => (
          <div
            key={blog.title}
            className="group overflow-hidden relative cursor-pointer bg-gray-100 aspect-[4/5]"
          >
            {/* Image */}
            <img 
              src={blog.image} 
              alt={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {/* Category */}
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">
                {blog.category}
              </p>
              
              {/* Title */}
              <h3 className="text-base md:text-lg font-semibold leading-tight mb-4 line-clamp-2">
                {blog.title}
              </h3>
              
              {/* Button */}
              <button className="text-xs uppercase tracking-wide border border-white/40 px-4 py-2 bg-white/10 hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm">
                Read More
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Blog;
