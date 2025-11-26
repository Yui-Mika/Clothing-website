import React, { useContext, useEffect, useState } from "react";
import Title from "./Title";
import { ShopContext } from "../context/ShopContext";
import Loading from "./Loading";

const Categories = () => {
  const { navigate, axios } = useContext(ShopContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories từ API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/category/list");
      
      if (data.success) {
        setCategories(data.categories);
      } else {
        console.error("Không tìm được danh mục:", data.message);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <section className="max-padd-container py-16 md:py-24">
      <Title
        title1={"Danh mục"}
        title2={"sản phẩm"}
        titleStyles={"pb-12"}
        paraStyles={"hidden"}
      />
      {/* container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {categories.map((category) => (
          <div
            key={category._id}
            onClick={() => navigate(`/collection/${category.slug}`)}
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