/* hiển thị danh sách sản phẩm, áp dụng bộ lọc theo danh mục (category) 
và tìm kiếm (search query), đồng thời quản lý phân trang (pagination). */ 
import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import Item from "../components/Item";
import { useParams } from "react-router-dom";

// Quản lý State
const CategoryCollection = () => {
  const { products, searchQuery } = useContext(ShopContext); // Lấy danh sách sản phẩm và từ khóa tìm kiếm từ context.
  const [filteredProducts, setFilteredProducts] = useState([]); // Mảng sản phẩm sau khi đã được lọc theo danh mục và từ khóa tìm kiếm.
  const [currentPage, setCurrentPage] = useState(1); //Số trang hiện tại mà người dùng đang xem (dùng cho phân trang).
  const itemsPerPage = 8; // Số lượng sản phẩm hiển thị trên mỗi trang.
  const { category } = useParams();


  // Logic lọc sản phẩm
  // Chịu trách nhiệm cập nhật danh sách sản phẩm hiển thị mỗi khi dữ liệu hoặc điều kiện lọc thay đổi
  useEffect(() => {
    let result = products;

    // Filter by category from URL
    if (category) {
      result = result.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Lọc theo từ khóa tìm kiếm (searchQuery) từ Context
    if (searchQuery.length > 0) {
      setFilteredProducts(
        (result = result.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }
    setFilteredProducts(result);
    setCurrentPage(1); // 🔁 Reset to first page on search/filter change
  }, [products, searchQuery, category]);

  // Tính toán tổng số trang dựa trên số sản phẩm đã lọc và số sản phẩm trên mỗi trang
  // Lưu ý: chỉ tính các sản phẩm còn hàng (inStock)
  const totalPages = Math.ceil(
    filteredProducts.filter((p) => p.inStock).length / itemsPerPage
  );

  // Cuộn trang khi chuyển trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Hiển thị giao diện
  return (
    <div className="max-padd-container py-16 pt-28">
      <Title
        title1={`${category}`}
        title2={"Products"}
        titleStyles={"pb-5 capitalize"}
      />
      {/* Sản phẩm và phân trang */}
      {/* Hiển thị danh sách sản phẩm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"> {/* Sử dụng CSS grid để bố trí sản phẩm */}
        {/* Logic hiển thị */}
        {filteredProducts.length > 0 ? (
          filteredProducts
            .filter((product) => product.inStock) // Chỉ hiển thị sản phẩm còn hàng
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) // Chọn sản phẩm cho trang hiện tại
            .map((product) => <Item key={product._id} product={product} />)
        ) : (
          <p>Oops! Nothing matched your search.</p> // Trường hợp không có sản phẩm nào phù hợp
        )}
      </div>
      {/* Phân trang - PAGINATION */}
      <div className="flexCenter flex-wrap gap-4 mt-14 mb-10">
        {/* Nút Previous */}
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className={`${
            currentPage === 1 && "opacity-50 cursor-not-allowed"
          } btn-dark !py-1 !px-3`}
        >
          Previous
        </button>
        {/* Các nút số trang */}
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => setCurrentPage(index + 1)}
            className={`${
              currentPage === index + 1 && "!bg-tertiary text-white"
            } btn-light !py-1 !px-3`}
          >
            {index + 1}
          </button>
        ))}
        {/* Nút Next */}
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

export default CategoryCollection;
