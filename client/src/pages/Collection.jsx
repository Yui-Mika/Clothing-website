// Trang "All Products" hiển thị tất cả sản phẩm với chức năng tìm kiếm và phân trang.
import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Item from "../components/Item";
import Title from "../components/Title";

const Collection = () => {
  const { products, searchQuery } = useContext(ShopContext); // Truy cập tất cả sản phẩm (products) và chuỗi tìm kiếm (searchQuery) từ ShopContext.
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1)
   const itemsPerPage = 10;

  // Logic lọc sản phẩm
  useEffect(() => {
    if (searchQuery.length > 0) {
      setFilteredProducts(
        products.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
     setCurrentPage(1); // 🔁 Reset to first page on search/filter change
  }, [products, searchQuery]);

  // Tính tổng số trang và cuộn trang
const totalPages = Math.ceil(filteredProducts.filter(p => p.inStock).length / itemsPerPage);

useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, [currentPage]);


  return (
    <div className="max-padd-container py-16 pt-28 bg-primary">
      {/* Tiêu đề và bố cục sản phẩm */}
      <Title
        title1={"All"}
        title2={"Products"}
        titleStyles={"pb-10"}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredProducts.length > 0 ? (
          // Render sản phẩm
          filteredProducts.filter((product) => product.inStock) // Chỉ hiển thị sản phẩm còn hàng
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((product) => (
            <Item key={product._id} product={product} />
          ))) :(
              <p>Oops! Nothing matched your search.</p>
          ) 
          }
      </div>
        {/* Phân trang - PAGINATION */}
          <div className="flexCenter flex-wrap gap-2 sm:gap-4 mt-14 mb-10">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className={`${
                currentPage === 1 && "opacity-50 cursor-not-allowed"
              } btn-dark !py-1 !px-3`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`${
                  currentPage === index + 1 && "!bg-tertiary !text-white"
                } btn-white !py-1 !px-3`}
              >
                {index + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className={`${
                currentPage === totalPages && "opacity-50 cursor-not-allowed"
              } btn-dark !py-1 !px-3`}
            >
              Next
            </button>
          </div>
    </div>
  );
};

export default Collection;
