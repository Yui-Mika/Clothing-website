import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import Loading from '../components/Loading'

const Blogs = () => {
  const { axios } = useContext(ShopContext)
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch blogs từ API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get('/api/blog/list')
        if (data.success) {
          // Sort by createdAt descending (mới nhất trước)
          const sortedBlogs = data.blogs.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          )
          setBlogs(sortedBlogs)
        }
      } catch (error) {
        console.error('Error fetching blogs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [axios])

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('vi-VN', options)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  // Empty state
  if (blogs.length === 0) {
    return (
      <section className="max-padd-container py-16 md:py-24">
        <Title
          title1={'Blog'}
          title2={'chuyên gia'}
          titleStyles={'pb-12'}
          paraStyles={'!block'}
          para={'Đặt trước xu hướng thời trang với mẹo phối đồ, đánh giá sản phẩm và lời khuyên chuyên gia.'}
        />
        <div className="text-center py-16">
          <p className="text-xl text-gray-500">Hiện chưa có bài viết nào.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-3 bg-tertiary text-white hover:bg-secondary transition-all duration-300"
          >
            Trở về trang chủ
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="max-padd-container py-16 pt-28">
      <Title
        title1={'Blog'}
        title2={'chuyên gia'}
        titleStyles={'pb-10'}
        paraStyles={'!block'}
        para={'Đặt trước xu hướng thới trang với mẹo phối đồ, đánh giá sản phẩm và lời khuyên chuyên gia giúp bạn mua sắm thông minh hơn và ăn mặc đẹp hơn.'}
      />

      {/* Grid Container - Responsive: 1 col (mobile), 2 cols (tablet), 4 cols (desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {blogs.map((blog) => (
          <div
            key={blog._id}
            onClick={() => navigate(`/blogs/${blog._id}`)}
            className="group overflow-hidden relative cursor-pointer bg-gray-100 aspect-[4/5] shadow-md hover:shadow-xl transition-shadow duration-300"
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

              {/* Excerpt */}
              <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                {blog.excerpt}
              </p>

              {/* Button */}
              <button className="text-xs uppercase tracking-wide border border-white/40 px-4 py-2 bg-white/10 hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm">
                Đọc thêm
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Blogs
