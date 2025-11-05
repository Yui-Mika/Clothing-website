/* hiển thị danh sách sản phẩm, áp dụng bộ lọc theo danh mục (category) 
và tìm kiếm (search query), đồng thời quản lý phân trang (pagination). */ 
import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import Item from "../components/Item";
import { useParams } from "react-router-dom";

// Quản lý State
const CategoryCollection = () => {
  const { products, searchQuery, axios } = useContext(ShopContext); // Lấy danh sách sản phẩm và từ khóa tìm kiếm từ context.
  const [filteredProducts, setFilteredProducts] = useState([]); // Mảng sản phẩm sau khi đã được lọc theo danh mục và từ khóa tìm kiếm.
  const [currentPage, setCurrentPage] = useState(1); //Số trang hiện tại mà người dùng đang xem (dùng cho phân trang).
  const itemsPerPage = 8; // Số lượng sản phẩm hiển thị trên mỗi trang.
  const { category } = useParams(); // Lấy slug từ URL
  const [categoryName, setCategoryName] = useState(""); // Tên category thực sự từ database


  // Fetch category name từ slug
  useEffect(() => {
    const fetchCategoryName = async () => {
      if (category) {
        try {
          const { data } = await axios.get(`/api/category/slug/${category}`);
          if (data.success) {
            setCategoryName(data.category.name);
          }
        } catch (error) {
          console.error("Error fetching category:", error);
        }
      }
    };
    fetchCategoryName();
  }, [category, axios]);

  // Logic lọc sản phẩm
  // Chịu trách nhiệm cập nhật danh sách sản phẩm hiển thị mỗi khi dữ liệu hoặc điều kiện lọc thay đổi
  useEffect(() => {
    let result = products;

    // Filter by category name (đã convert từ slug)
    if (categoryName) {
      result = result.filter(
        (product) => product.category === categoryName
      );
    }

    // Lọc theo từ khóa tìm kiếm (searchQuery) từ Context
    if (searchQuery.length > 0) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredProducts(result);
    setCurrentPage(1); // 🔁 Reset to first page on search/filter change
  }, [products, searchQuery, categoryName]);

  // Tính toán tổng số trang dựa trên số sản phẩm đã lọc và số sản phẩm trên mỗi trang
  // Lưu ý: chỉ tính các sản phẩm còn hàng (inStock)
  const totalPages = Math.ceil(
    filteredProducts.filter((p) => p.inStock).length / itemsPerPage
  );

  // Cuộn trang khi chuyển trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // 
  return (
    <div className="max-padd-container py-16 pt-28">
      <Title
        title1={categoryName || category}
        title2={"Products"}
        titleStyles={"pb-5"}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredProducts.length > 0 ? (
          filteredProducts
            .filter((product) => product.inStock)
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((product) => <Item key={product._id} product={product} />)
        ) : (
          <p>Oops! Nothing matched your search.</p>
        )}
      </div>
      {/* PAGINATION */}
      <div className="flexCenter flex-wrap gap-4 mt-14 mb-10">
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
              currentPage === index + 1 && "!bg-tertiary text-white"
            } btn-light !py-1 !px-3`}
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

export default CategoryCollection;
