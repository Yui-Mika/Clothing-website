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
  const itemsPerPage = 10; // Số lượng sản phẩm hiển thị trên mỗi trang.
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

  // Calculate product range display
  const inStockProducts = filteredProducts.filter(p => p.inStock);
  const startProduct = (currentPage - 1) * itemsPerPage + 1;
  const endProduct = Math.min(currentPage * itemsPerPage, inStockProducts.length);

  // 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-16 pt-28">
      <div className="max-padd-container">
        {/* Glass Container */}
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 md:p-12">
          {/* Elegant Title */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {categoryName || category} <span className="text-gray-400 font-light">Sản Phẩm</span>
            </h1>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.length > 0 ? (
              filteredProducts
                .filter((product) => product.inStock)
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((product) => <Item key={product._id} product={product} />)
            ) : (
              <p className="text-gray-500 col-span-full text-center py-10">
                Rất tiếc! Không tìm thấy sản phẩm nào phù hợp.
              </p>
            )}
          </div>

          {/* Pagination */}
          {inStockProducts.length > 0 && (
            <div className="mt-16 mb-6">
              <div className="flex flex-col items-center gap-6">
                {/* Pagination Buttons */}
                <div className="flex items-center gap-3">
                  {/* Previous Button */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className={`w-11 h-11 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                      currentPage === 1
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-lg"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`w-11 h-11 rounded-full border-2 transition-all duration-300 font-medium ${
                          currentPage === index + 1
                            ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                            : "border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className={`w-11 h-11 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                      currentPage === totalPages
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-lg"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Product Count Display */}
                <p className="text-sm text-gray-500">
                  Hiển thị {startProduct}-{endProduct} trong tổng số {inStockProducts.length} sản phẩm
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryCollection;
