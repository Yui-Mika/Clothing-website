import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import Loading from '../components/Loading'
import { FiArrowLeft, FiClock, FiShare2 } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const BlogDetails = () => {
  const { id } = useParams()
  const { axios } = useContext(ShopContext)
  const navigate = useNavigate()
  const [blog, setBlog] = useState(null)
  const [relatedBlogs, setRelatedBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Fetch blog details
  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        setLoading(true)
        setError(false)
        const { data } = await axios.get(`/api/blog/${id}`)
        if (data.success) {
          setBlog(data.blog)
          // Fetch related blogs (4 blogs khác, mới nhất)
          fetchRelatedBlogs(data.blog._id)
        } else {
          setError(true)
        }
      } catch (error) {
        console.error('Error fetching blog details:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogDetails()
  }, [id, axios])

  // Fetch related blogs
  const fetchRelatedBlogs = async (currentBlogId) => {
    try {
      const { data } = await axios.get('/api/blog/list')
      if (data.success) {
        // Filter out current blog and get 4 latest
        const filtered = data.blogs
          .filter(b => b._id !== currentBlogId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4)
        setRelatedBlogs(filtered)
      }
    } catch (error) {
      console.error('Error fetching related blogs:', error)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('en-US', options)
  }

  // Copy link to clipboard
  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  // Error / 404 state
  if (error || !blog) {
    return (
      <section className="max-padd-container py-16 md:py-24">
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Blog Not Found</h1>
          <p className="text-xl text-gray-500 mb-8">The blog you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/blogs')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-tertiary text-white hover:bg-secondary transition-all duration-300"
          >
            <FiArrowLeft />
            Back to Blogs
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 md:py-12">
      {/* Back Button */}
      <div className="max-padd-container mb-6">
        <button
          onClick={() => navigate('/blogs')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-tertiary transition-colors duration-300 text-sm font-medium"
        >
          <FiArrowLeft className="text-lg" />
          Back to Blogs
        </button>
      </div>

      {/* Hero Image */}
      <div className="w-full h-[300px] md:h-[500px] overflow-hidden bg-gray-100 mb-8">
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Container */}
      <div className="max-padd-container">
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FiClock />
            <span>{formatDate(blog.createdAt)}</span>
          </div>
          <button
            onClick={handleShareLink}
            className="flex items-center gap-2 hover:text-tertiary transition-colors"
          >
            <FiShare2 />
            <span>Share</span>
          </button>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {blog.title}
        </h1>

        {/* Excerpt */}
        <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
          {blog.excerpt}
        </p>

        {/* Divider */}
        <div className="w-20 h-1 bg-tertiary mb-8"></div>

        {/* Content (HTML) */}
        <div 
          className="prose prose-lg max-w-none mb-16
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
            prose-li:text-gray-700 prose-li:mb-2
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-a:text-tertiary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <div
                  key={relatedBlog._id}
                  onClick={() => {
                    navigate(`/blogs/${relatedBlog._id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group cursor-pointer"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-4">
                    <img
                      src={relatedBlog.image}
                      alt={relatedBlog.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  {/* Date */}
                  <p className="text-xs text-gray-500 mb-2">{formatDate(relatedBlog.createdAt)}</p>
                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-tertiary transition-colors line-clamp-2">
                    {relatedBlog.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Back Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => {
              navigate('/blogs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 hover:bg-tertiary hover:text-white transition-all duration-300"
          >
            <FiArrowLeft />
            Back to All Blogs
          </button>
        </div>
      </div>
    </section>
  )
}

export default BlogDetails
