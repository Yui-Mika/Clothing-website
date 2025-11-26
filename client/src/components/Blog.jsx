import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const Blog = () => {
  const { axios } = useContext(ShopContext);
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch blogs từ API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/blog/list");
        if (data.success) {
          // Sort by createdAt descending và limit 4 blogs mới nhất
          const latestBlogs = data.blogs
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4);
          setBlogs(latestBlogs);
        }
      } catch (error) {
        console.error("Lỗi khi tải bài viết:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [axios]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };

  // Don't show section nếu không có blogs
  if (loading || blogs.length === 0) {
    return null;
  }

  return (
    <section className="max-padd-container py-16 md:py-24">
      <Title
        title2={"Chuyên Gia"}
        title1={"Blog"}
        titleStyles={"pb-12 pt-30"}
        paraStyles={"!block"}
        para={"Luôn dẫn đầu xu hướng thời trang với mẹo phối đồ, đánh giá sản phẩm và lời khuyên chuyên gia giúp bạn mua sắm thông minh hơn và mặc đẹp hơn."}
      />

      {/* Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {blogs.map((blog) => (
          <div
            key={blog._id}
            onClick={() => {
              navigate(`/blogs/${blog._id}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
              {/* Date */}
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">
                {formatDate(blog.createdAt)}
              </p>

              {/* Title */}
              <h3 className="text-base md:text-lg font-semibold leading-tight mb-4 line-clamp-2">
                {blog.title}
              </h3>

              {/* Button */}
              <button className="text-xs uppercase tracking-wide border border-white/40 px-4 py-2 bg-white/10 hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm">
                Đọc thêm
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View All Blogs Button */}
      <div className="text-center mt-12">
        <button
          onClick={() => {
            navigate("/blogs");
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-block px-8 py-3 bg-tertiary text-white text-sm font-semibold uppercase tracking-wide hover:bg-secondary transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Xem tất cả các bài viết
        </button>
      </div>
    </section>
  );
};

export default Blog;
