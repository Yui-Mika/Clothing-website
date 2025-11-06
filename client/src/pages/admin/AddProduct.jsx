import React, { useContext, useState } from 'react' // import React và hooks useContext, useState
import upload_icon from "../../assets/upload_icon.png" // import ảnh mặc định cho ô upload
import { toast } from 'react-hot-toast' // import toast để hiển thị thông báo
import { ShopContext } from '../../context/ShopContext' // import context chứa axios, products, ...

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

  const {axios} = useContext(ShopContext) // lấy axios từ context để gọi API

  // Hàm submit form thêm sản phẩm
  const onSubmitHandler = async (e) => {
    e.preventDefault() // ngăn form submit mặc định (reload trang)
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
        toast.success(data.message) // hiển thị thông báo thành công
        // reset form
        setName("")
        setDescription("")
        setFiles([])
        setSizes([])
        setPrice("10")
        setOfferPrice("10")
      } else {
        toast.error(data.message) // hiển thị lỗi từ server
      }

    } catch (error) {
     toast.error(error.message) // hiển thị lỗi nếu request bị lỗi
    }
  }

  return (
     <div className='px-2 sm:px-6 py-12 m-2 h-[97vh] bg-primary overflow-y-scroll w-full lg:w-4/5 rounded-xl'>
      <form onSubmit={onSubmitHandler} className='flex flex-col gap-y-3 medium-14'>
        {/* Tên sản phẩm */}
        <div className='w-full'>
          <h5 className='h5'>Product Name</h5>
          <input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder='Write here..' className='px-3 py-1.5 ring-1 ring-slate-900/10 rounded bg-white mt-1 w-full max-w-xl' />
        </div>
        {/* Mô tả sản phẩm */}
        <div className='w-full'>
          <h5 className='h5'>Product Description</h5>
          <textarea onChange={(e) => setDescription(e.target.value)} value={description} rows={5} type="text" placeholder='Write here..' className='px-3 py-1.5 ring-1 ring-slate-900/10 rounded bg-white mt-1 w-full max-w-xl resize-none' />
        </div>
        {/* Categories - chọn danh mục, giá, giá khuyến mãi */}
        <div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex flow-row gap-4'>
              <div>
                <h5 className='h5'>Category</h5>
                <select onChange={(e) => setCategory(e.target.value)} className='max-w-40 px-3 py-2 text-gray-30 ring-1 ring-slate-900/5 bg-white rounded'>
                  <option value="Shirts & Polo">Shirts & Polo</option>
                  <option value="Bottoms">Bottoms</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="InnerWear & Underwear">InnerWear & Underwear</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            </div>
            {/* Giá gốc */}
            <div>
              <h5 className='h5'>Product Price</h5>
              <input onChange={(e) => setPrice(e.target.value)} value={price} type="number" placeholder='10' className='px-3
               py-2 bg-white rounded max-w-24 ring-1 ring-slate-900/5' />
            </div>
          </div>
        </div>
        {/* Sizes - chọn các size có sẵn */}
        <div>
          <h5 className='h5'>Product Sizes</h5>
          <div className='flex gap-3 mt-2'>
            <div onClick={() => setSizes(prev => prev.includes("S") ? prev.filter(item => item !== "S") : [...prev, "S"])}><span className={`${sizes.includes("S") ? "bg-tertiary text-white" : "bg-white"} text-gray-30 rounded ring-1 ring-slate-900/5 px-3 py-1 cursor-pointer`} >S</span></div>
            <div onClick={() => setSizes(prev => prev.includes("M") ? prev.filter(item => item !== "M") : [...prev, "M"])}><span className={`${sizes.includes("M") ? "bg-tertiary text-white" : "bg-white"} text-gray-30 rounded ring-1 ring-slate-900/5 px-3 py-1 cursor-pointer`} >M</span></div>
            <div onClick={() => setSizes(prev => prev.includes("L") ? prev.filter(item => item !== "L") : [...prev, "L"])}><span className={`${sizes.includes("L") ? "bg-tertiary text-white" : "bg-white"} text-gray-30 rounded ring-1 ring-slate-900/5 px-3 py-1 cursor-pointer`} >L</span></div>
            <div onClick={() => setSizes(prev => prev.includes("XL") ? prev.filter(item => item !== "XL") : [...prev, "XL"])}><span className={`${sizes.includes("XL") ? "bg-tertiary text-white" : "bg-white"} text-gray-30 rounded ring-1 ring-slate-900/5 px-3 py-1 cursor-pointer`} >XL</span></div>
            <div onClick={() => setSizes(prev => prev.includes("XXL") ? prev.filter(item => item !== "XXL") : [...prev, "XXL"])}><span className={`${sizes.includes("XXL") ? "bg-tertiary text-white" : "bg-white"} text-gray-30 rounded ring-1 ring-slate-900/5 px-3 py-1 cursor-pointer`} >XXL</span></div>
          </div>
        </div>
        {/* images - vùng upload 4 ảnh */}
        <div className='flex gap-2 pt-2'>
          {Array(4).fill('').map((_, index)=>(
            <label key={index} htmlFor={`image${index}`} className='rounded overflow-hidden'>
              {/* input file bị ẩn, thay đổi sẽ cập nhật state files */}
              <input onChange={(e)=>{
                const updatedFiles = [...files]
                updatedFiles[index] = e.target.files[0]
                setFiles(updatedFiles)
              }}
              type="file" id={`image${index}`} hidden />
              {/* hiển thị ảnh đã chọn hoặc icon upload nếu chưa chọn */}
              <img src={files[index] ? URL.createObjectURL(files[index]) : upload_icon} alt="uploadArea" width={67} height={67} className='bg-white'/>
            </label>
          ))}
        </div>
        {/* checkbox thêm vào popular */}
        <div className='flexStart gap-2 my-2'>
          <input onChange={() => setPopular(prev => !prev)} type="checkbox" checked={popular} id='popular' />
          <label htmlFor="popular" className='cursor-pointer'>Add to popular</label>
        </div>
        {/* nút submit form */}
        <button type='submit' className='btn-dark mt-3 max-w-44 sm:w-full rounded'>Add Product</button>
      </form>
    </div>
  )
}

export default AddProduct // xuất component