import React, { useContext, useState } from 'react' // import React và hooks useContext, useState
import upload_icon from "../../assets/upload_icon.png" // import ảnh mặc định cho ô upload
import { toast } from 'react-hot-toast' // import toast để hiển thị thông báo
import { ShopContext } from '../../context/ShopContext' // import context chứa axios, products, ...
import { FaTrash, FaChevronRight } from 'react-icons/fa'

// Component để thêm sản phẩm mới (Admin)
const AddProduct = () => {

  // Khai báo các state dùng trong form
  const [files, setFiles] = useState([]) // mảng chứa file ảnh được chọn
  const [name, setName] = useState("") // tên sản phẩm
  const [description, setDescription] = useState("") // mô tả sản phẩm
  const [price, setPrice] = useState("10") // giá gốc
  const [offerPrice, setOfferPrice] = useState('10') // giá khuyến mãi
  const [category, setCategory] = useState("Shirts & Polo") // danh mục mặc định
  const [popular, setPopular] = useState(false) // flag sản phẩm popular
  const [sizes, setSizes] = useState([]) // mảng size được chọn
  const [loading, setLoading] = useState(false) // loading state
  const [errors, setErrors] = useState({}) // validation errors

  const {axios} = useContext(ShopContext) // lấy axios từ context để gọi API

  // Validation function
  const validateForm = () => {
    const newErrors = {}
    
    if (!name.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (files.length === 0) {
      newErrors.images = 'At least 1 product image is required'
    }
    if (sizes.length === 0) {
      newErrors.sizes = 'Please select at least 1 size'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Hàm submit form thêm sản phẩm
  const onSubmitHandler = async (e) => {
    e.preventDefault() // ngăn form submit mặc định (reload trang)
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {

      // Tạo object productData chứa thông tin sản phẩm (không gồm ảnh)
      const productData = {
        name,
        description,
        category,
        price,
        offerPrice,
        sizes,
        popular,
      }

      const formData = new FormData() // tạo FormData để upload file

      formData.append('productData', JSON.stringify(productData)) // đính kèm productData dưới dạng JSON string
      for (let i = 0; i < files.length; i++) {
       formData.append('images', files[i]) // append từng file ảnh (key 'images')
      }

      // Gọi API server để thêm sản phẩm
      const {data} = await axios.post('/api/product/add', formData)

      if (data.success) {
        toast.success('✅ Product added successfully!', {
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#10b981',
            color: '#fff',
            padding: '16px',
          }
        })
        // reset form
        setName("")
        setDescription("")
        setFiles([])
        setSizes([])
        setPrice("10")
        setOfferPrice("10")
        setPopular(false)
        setErrors({})
      } else {
        toast.error(data.message) // hiển thị lỗi từ server
      }

    } catch (error) {
     toast.error('❌ Failed to add product!', {
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: '#ef4444',
          color: '#fff',
          padding: '16px',
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // Remove image function
  const removeImage = (index) => {
    const updatedFiles = [...files]
    updatedFiles[index] = null
    setFiles(updatedFiles)
    if (errors.images && updatedFiles.filter(f => f).length > 0) {
      setErrors(prev => ({...prev, images: ''}))
    }
  }

  return (
    <div className='w-full lg:w-4/5 px-2 sm:px-6 py-6 m-2 max-h-[97vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white rounded-2xl'>
      
      {/* Sticky Header with Breadcrumb */}
      <div className='sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-2xl border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          {/* Breadcrumb */}
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-gray-500 font-medium'>Admin</span>
            <FaChevronRight className='text-gray-400 text-xs' />
            <span className='text-gray-900 font-semibold'>Add Product</span>
          </div>
          
          {/* Save Button */}
          <button 
            type='submit' 
            form='product-form'
            disabled={loading}
            className='px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative'
          >
            {loading ? (
              <>
                <span className='opacity-0'>Save Product</span>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                </div>
              </>
            ) : (
              'Save Product'
            )}
          </button>
        </div>
      </div>

      <form id='product-form' onSubmit={onSubmitHandler} className='flex flex-col gap-6'>
        
        {/* Basic Information Card */}
        <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <span className='w-1 h-6 bg-gray-900 rounded-full'></span>
            Basic Information
          </h3>
          
          {/* Product Name */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Product Name <span className='text-red-500'>*</span>
            </label>
            <input 
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors(prev => ({...prev, name: ''}))
              }} 
              value={name} 
              type="text" 
              placeholder='Enter product name...' 
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                errors.name 
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                  : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20'
              } outline-none`}
            />
            {errors.name && (
              <p className='text-red-500 text-sm mt-1 flex items-center gap-1'>
                <span>⚠️</span> {errors.name}
              </p>
            )}
          </div>
          
          {/* Product Description */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Product Description <span className='text-red-500'>*</span>
            </label>
            <textarea 
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors(prev => ({...prev, description: ''}))
              }} 
              value={description} 
              rows={5} 
              placeholder='Describe your product in detail...' 
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 resize-none ${
                errors.description 
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                  : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20'
              } outline-none`}
            />
            {errors.description && (
              <p className='text-red-500 text-sm mt-1 flex items-center gap-1'>
                <span>⚠️</span> {errors.description}
              </p>
            )}
          </div>
        </div>

        {/* Pricing & Category Card */}
        <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <span className='w-1 h-6 bg-gray-900 rounded-full'></span>
            Pricing & Category
          </h3>
          
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            {/* Category */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Category
              </label>
              <select 
                onChange={(e) => setCategory(e.target.value)} 
                value={category}
                className='w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 outline-none bg-white transition-all duration-200 cursor-pointer'
              >
                <option value="Shirts & Polo">Shirts & Polo</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Outerwear">Outerwear</option>
                <option value="InnerWear & Underwear">InnerWear & Underwear</option>
                <option value="Shoes">Shoes</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            
            {/* Product Price */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Product Price ($)
              </label>
              <input 
                onChange={(e) => setPrice(e.target.value)} 
                value={price} 
                type="number" 
                placeholder='10' 
                className='w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' 
              />
            </div>
            
            {/* Offer Price */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Offer Price ($)
              </label>
              <input 
                onChange={(e) => setOfferPrice(e.target.value)} 
                value={offerPrice} 
                type="number" 
                placeholder='10' 
                className='w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' 
              />
            </div>
          </div>
        </div>

        {/* Size Selection Card */}
        <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <span className='w-1 h-6 bg-gray-900 rounded-full'></span>
            Size Selection <span className='text-red-500'>*</span>
          </h3>
          
          <div className='flex flex-wrap gap-3'>
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <button
                key={size}
                type='button'
                onClick={() => {
                  setSizes(prev => prev.includes(size) ? prev.filter(item => item !== size) : [...prev, size])
                  if (errors.sizes) setErrors(prev => ({...prev, sizes: ''}))
                }}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 border-2 ${
                  sizes.includes(size) 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-lg transform scale-105' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {errors.sizes && (
            <p className='text-red-500 text-sm mt-3 flex items-center gap-1'>
              <span>⚠️</span> {errors.sizes}
            </p>
          )}
        </div>

        {/* Product Images Card */}
        <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <span className='w-1 h-6 bg-gray-900 rounded-full'></span>
            Product Images <span className='text-red-500'>*</span>
          </h3>
          
          <p className='text-sm text-gray-500 mb-4'>Upload up to 4 images. First image will be the main product image.</p>
          
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            {Array(4).fill('').map((_, index) => (
              <div key={index} className='relative group'>
                <label 
                  htmlFor={`image${index}`} 
                  className={`block aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-dashed transition-all duration-300 ${
                    files[index] 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <input 
                    onChange={(e) => {
                      const updatedFiles = [...files]
                      updatedFiles[index] = e.target.files[0]
                      setFiles(updatedFiles)
                      if (errors.images) setErrors(prev => ({...prev, images: ''}))
                    }}
                    type="file" 
                    id={`image${index}`} 
                    accept="image/*"
                    hidden 
                  />
                  
                  {files[index] ? (
                    <div className='relative w-full h-full'>
                      <img 
                        src={URL.createObjectURL(files[index])} 
                        alt={`Product ${index + 1}`} 
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-semibold'>
                        {index + 1}
                      </div>
                    </div>
                  ) : (
                    <div className='w-full h-full flex flex-col items-center justify-center gap-2 p-4'>
                      <img src={upload_icon} alt="Upload" className='w-12 h-12 opacity-40' />
                      <p className='text-xs text-gray-400 text-center font-medium'>
                        Click to upload
                      </p>
                    </div>
                  )}
                </label>
                
                {/* Delete Button */}
                {files[index] && (
                  <button
                    type='button'
                    onClick={() => removeImage(index)}
                    className='absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-lg'
                  >
                    <FaTrash className='text-xs' />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.images && (
            <p className='text-red-500 text-sm mt-3 flex items-center gap-1'>
              <span>⚠️</span> {errors.images}
            </p>
          )}
        </div>

        {/* Additional Options Card */}
        <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <span className='w-1 h-6 bg-gray-900 rounded-full'></span>
            Additional Options
          </h3>
          
          <label className='flex items-center gap-3 cursor-pointer group'>
            <input 
              onChange={() => setPopular(prev => !prev)} 
              type="checkbox" 
              checked={popular} 
              className='w-5 h-5 rounded border-2 border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/20 cursor-pointer'
            />
            <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors'>
              Add to popular products
            </span>
          </label>
        </div>

      </form>
    </div>
  )
}

export default AddProduct // xuất component