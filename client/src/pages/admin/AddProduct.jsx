import React, { useContext, useState } from 'react' // import React và hooks useContext, useState
import upload_icon from "../../assets/upload_icon.png" // import ảnh mặc định cho ô upload
import { toast } from 'react-hot-toast' // import toast để hiển thị thông báo
import { ShopContext } from '../../context/ShopContext' // import context chứa axios, products, ...
import { FaTrash, FaChevronRight, FaGripVertical } from 'react-icons/fa'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Image Item Component
const SortableImageItem = ({ id, file, index, onRemove, totalImages }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      <div className='aspect-square rounded-xl overflow-hidden border-2 border-gray-900 bg-gray-50 relative'>
        {file ? (
          <>
            <img 
              src={URL.createObjectURL(file)} 
              alt={`Product ${index + 1}`} 
              className='w-full h-full object-cover'
            />
            {/* Drag Handle */}
            <div 
              {...attributes} 
              {...listeners}
              className='absolute top-2 left-2 bg-gray-900/80 text-white p-2 rounded-lg cursor-move hover:bg-gray-900 transition-colors'
            >
              <FaGripVertical />
            </div>
            {/* Image Number Badge */}
            <div className='absolute top-2 right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-semibold'>
              {index + 1}
            </div>
            {/* Delete Button */}
            <button
              type='button'
              onClick={onRemove}
              className='absolute bottom-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-lg'
            >
              <FaTrash className='text-xs' />
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

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
  const [quantity, setQuantity] = useState(0) // số lượng sản phẩm
  const [loading, setLoading] = useState(false) // loading state
  const [errors, setErrors] = useState({}) // validation errors

  const {axios} = useContext(ShopContext) // lấy axios từ context để gọi API

  // Validation function
  const validateForm = () => {
    const newErrors = {}
    
    if (!name.trim()) {
      newErrors.name = 'Tên sản phẩm là bắt buộc'
    }
    if (!description.trim()) {
      newErrors.description = 'Cần phải mô tả sản phẩm'
    }
    if (files.length === 0) {
      newErrors.images = 'Cần ít nhất 1 ảnh sản phẩm'
    }
    if (sizes.length === 0) {
      newErrors.sizes = 'Cần chọn ít nhất 1 size'
    }
    if (!price || parseFloat(price) <= 0) {
      newErrors.price = 'Giá phải lớn hơn 0'
    }
    if (quantity < 0) {
      newErrors.quantity = 'Số lượng không được âm'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Hàm submit form thêm sản phẩm
  const onSubmitHandler = async (e) => {
    e.preventDefault() // ngăn form submit mặc định (reload trang)
    
    // Validate form
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
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
        offerPrice: offerPrice || price, // Nếu không có giá KM thì dùng giá gốc
        sizes,
        popular,
        quantity,
      }

      const formData = new FormData() // tạo FormData để upload file

      formData.append('productData', JSON.stringify(productData)) // đính kèm productData dưới dạng JSON string
      for (let i = 0; i < files.length; i++) {
       formData.append('images', files[i]) // append từng file ảnh (key 'images')
      }

      // Gọi API server để thêm sản phẩm
      const {data} = await axios.post('/api/product/add', formData)

      if (data.success) {
        toast.success('✅ Thêm sản phẩm thành công!', {
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
        setQuantity(0)
        setErrors({})
      } else {
        toast.error(data.message) // hiển thị lỗi từ server
      }

    } catch (error) {
     toast.error('❌ Không thể thêm sản phẩm!', {
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

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Chỉ kích hoạt drag sau khi di chuyển 8px
      },
    })
  )

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = files.findIndex((_, idx) => `image-${idx}` === active.id)
      const newIndex = files.findIndex((_, idx) => `image-${idx}` === over.id)
      setFiles(arrayMove(files, oldIndex, newIndex))
    }
  }

  return (
    <div className='w-full lg:w-4/5 px-2 sm:px-6 py-6 m-2 max-h-[97vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white rounded-2xl'>
      
      {/* Sticky Header with Breadcrumb */}
      <div className='sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-2xl border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          {/* Breadcrumb */}
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-gray-500 font-medium'>Quản trị</span>
            <FaChevronRight className='text-gray-400 text-xs' />
            <span className='text-gray-900 font-semibold'>Thêm sản phẩm</span>
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
                <span className='opacity-0'>Lưu sản phẩm</span>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                </div>
              </>
            ) : (
              'Lưu sản phẩm'
            )}
          </button>
        </div>
      </div>

      <form id='product-form' onSubmit={onSubmitHandler} className='flex flex-col gap-6'>
        
        {/* Basic Information Card */}
        <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <span className='w-1 h-6 bg-gray-900 rounded-full'></span>
            Thông tin cơ bản
          </h3>
          
          {/* Product Name */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Tên sản phẩm <span className='text-red-500'>*</span>
            </label>
            <input 
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors(prev => ({...prev, name: ''}))
              }} 
              value={name} 
              type="text" 
              placeholder='Nhập tên sản phẩm...' 
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
              Mô tả sản phẩm <span className='text-red-500'>*</span>
            </label>
            <textarea 
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors(prev => ({...prev, description: ''}))
              }} 
              value={description} 
              rows={5} 
              placeholder='Mô tả chi tiết về sản phẩm...' 
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
            Giá và danh mục
          </h3>
          
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Category */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Danh mục
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
                Giá sản phẩm (₫) <span className='text-red-500'>*</span>
              </label>
              <input 
                onChange={(e) => {
                  setPrice(e.target.value)
                  if (errors.price) setErrors(prev => ({...prev, price: ''}))
                }} 
                value={price} 
                type="number" 
                placeholder='240000' 
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  errors.price 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20'
                } outline-none`}
              />
              {errors.price && (
                <p className='text-red-500 text-sm mt-1 flex items-center gap-1'>
                  <span>⚠️</span> {errors.price}
                </p>
              )}
            </div>
            
            {/* Offer Price */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Giá khuyến mãi (₫) <span className='text-gray-400 text-xs'>(Tùy chọn)</span>
              </label>
              <input 
                onChange={(e) => setOfferPrice(e.target.value)} 
                value={offerPrice} 
                type="number" 
                placeholder='Để trống = giá gốc' 
                className='w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' 
              />
              <p className='text-xs text-gray-500 mt-1'>Bỏ trống nếu không có khuyến mãi</p>
            </div>
            
            {/* Quantity */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Số lượng <span className='text-red-500'>*</span>
              </label>
              <input 
                onChange={(e) => {
                  setQuantity(Math.max(0, parseInt(e.target.value) || 0))
                  if (errors.quantity) setErrors(prev => ({...prev, quantity: ''}))
                }} 
                value={quantity} 
                type="number" 
                placeholder='0' 
                min="0"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  errors.quantity 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20'
                } outline-none`}
              />
              {errors.quantity && (
                <p className='text-red-500 text-sm mt-1 flex items-center gap-1'>
                  <span>⚠️</span> {errors.quantity}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Size Selection Card */}
        <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <span className='w-1 h-6 bg-gray-900 rounded-full'></span>
            Chọn kích cỡ <span className='text-red-500'>*</span>
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
            Hình ảnh sản phẩm <span className='text-red-500'>*</span>
          </h3>
          
          <p className='text-sm text-gray-500 mb-4'>
            Tải lên tối đa 4 hình ảnh. <strong>Kéo thả</strong> để sắp xếp lại thứ tự. Hình ảnh đầu tiên sẽ là hình ảnh chính.
          </p>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={files.map((_, idx) => `image-${idx}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                {Array(4).fill('').map((_, index) => (
                  files[index] ? (
                    <SortableImageItem
                      key={`image-${index}`}
                      id={`image-${index}`}
                      file={files[index]}
                      index={index}
                      onRemove={() => removeImage(index)}
                      totalImages={files.filter(f => f).length}
                    />
                  ) : (
                    <div key={`upload-${index}`} className='relative group'>
                      <label 
                        htmlFor={`image${index}`} 
                        className='block aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-900 hover:bg-gray-100 transition-all duration-300'
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
                        
                        <div className='w-full h-full flex flex-col items-center justify-center gap-2 p-4'>
                          <img src={upload_icon} alt="Upload" className='w-12 h-12 opacity-40' />
                          <p className='text-xs text-gray-400 text-center font-medium'>
                            Nhấn để tải lên
                          </p>
                        </div>
                      </label>
                    </div>
                  )
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
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
            Tùy chọn khác
          </h3>
          
          <label className='flex items-center gap-3 cursor-pointer group'>
            <input 
              onChange={() => setPopular(prev => !prev)} 
              type="checkbox" 
              checked={popular} 
              className='w-5 h-5 rounded border-2 border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/20 cursor-pointer'
            />
            <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors'>
              Thêm vào sản phẩm nổi bật
            </span>
          </label>
        </div>

      </form>
    </div>
  )
}

export default AddProduct // xuất component