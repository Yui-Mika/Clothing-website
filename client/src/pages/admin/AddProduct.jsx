import React, { useContext, useState } from 'react'
import upload_icon from "../../assets/upload_icon.png"
import { toast } from 'react-hot-toast'
import { ShopContext } from '../../context/ShopContext'

const AddProduct = () => {

  const [files, setFiles] = useState([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("10")
  const [offerPrice, setOfferPrice] = useState('10')
  const [category, setCategory] = useState("Men")
  const [popular, setPopular] = useState(false)
  const [sizes, setSizes] = useState([])

  const {axios} = useContext(ShopContext)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {

      const productData = {
        name,
        description,
        category,
        price,
        offerPrice,
        sizes,
        popular,
      }

      const formData = new FormData()

      formData.append('productData', JSON.stringify(productData))
      for (let i = 0; i < files.length; i++) {
       formData.append('images', files[i])
      }

      const {data} = await axios.post('/api/product/add', formData)

      if (data.success) {
        toast.success(data.message)
        setName("")
        setDescription("")
        setFiles([])
        setSizes([])
        setPrice("10")
        setOfferPrice("10")
      } else {
        toast.error(data.message)
      }

    } catch (error) {
     toast.error(error.message)
    }
  }

  return (
     <div className='px-2 sm:px-6 py-12 m-2 h-[97vh] bg-primary overflow-y-scroll w-full lg:w-4/5 rounded-xl'>
      <form onSubmit={onSubmitHandler} className='flex flex-col gap-y-3 medium-14'>
        <div className='w-full'>
          <h5 className='h5'>Product Name</h5>
          <input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder='Write here..' className='px-3 py-1.5 ring-1 ring-slate-900/10 rounded bg-white mt-1 w-full max-w-xl' />
        </div>
        <div className='w-full'>
          <h5 className='h5'>Product Description</h5>
          <textarea onChange={(e) => setDescription(e.target.value)} value={description} rows={5} type="text" placeholder='Write here..' className='px-3 py-1.5 ring-1 ring-slate-900/10 rounded bg-white mt-1 w-full max-w-xl resize-none' />
        </div>
        {/* Categories */}
        <div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex flow-row gap-4'>
              <div>
                <h5 className='h5'>Category</h5>
                <select onChange={(e) => setCategory(e.target.value)} className='max-w-20 px-3 py-2 text-gray-30 ring-1 ring-slate-900/5 bg-white rounded'>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Winterwear">Winterwear</option>
                  <option value="Sportswear">Sportswear</option>
                </select>
              </div>
            </div>
            <div>
              <h5 className='h5'>Product Price</h5>
              <input onChange={(e) => setPrice(e.target.value)} value={price} type="number" placeholder='10' className='px-3
               py-2 bg-white rounded max-w-24 ring-1 ring-slate-900/5' />
            </div>
            <div>
              <h5 className='h5'>Offer Price</h5>
              <input onChange={(e) => setOfferPrice(e.target.value)} value={offerPrice} type="number" placeholder='10' className='px-3
               py-2 bg-white rounded max-w-24 ring-1 ring-slate-900/5' />
            </div>
          </div>
        </div>
        {/* Sizes */}
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
        {/* images */}
        <div className='flex gap-2 pt-2'>
          {Array(4).fill('').map((_, index)=>(
            <label key={index} htmlFor={`image${index}`} className='rounded overflow-hidden'>
              <input onChange={(e)=>{
                const updatedFiles = [...files]
                updatedFiles[index] = e.target.files[0]
                setFiles(updatedFiles)
              }}
              type="file" id={`image${index}`} hidden />
              <img src={files[index] ? URL.createObjectURL(files[index]) : upload_icon} alt="uploadArea" width={67} height={67} className='bg-white'/>
            </label>
          ))}
        </div>
        <div className='flexStart gap-2 my-2'>
          <input onChange={() => setPopular(prev => !prev)} type="checkbox" checked={popular} id='popular' />
          <label htmlFor="popular" className='cursor-pointer'>Add to popular</label>
        </div>
        <button type='submit' className='btn-dark mt-3 max-w-44 sm:w-full rounded'>Add Product</button>
      </form>
    </div>
  )
}

export default AddProduct