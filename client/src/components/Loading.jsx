// hiển thị một màn hình tải (loading spinner) và thực hiện chức năng chuyển hướng tự động
// thường được sử dụng sau các hành động như đặt hàng, thanh toán, hoặc xác thực thành công.
// cung cấp phản hồi hình ảnh cho người dùng (đang tải) và điều hướng họ đến một trang khác được chỉ định trong URL.
import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useLocation } from 'react-router-dom'

const Loading = () => {
  // truy vấn hàm điều hướng từ ShopContext
    const {navigate} = useContext(ShopContext)
    let {search} = useLocation()
    const query = new URLSearchParams(search)
    const nextUrl = query.get('next')

    // Hàm Chuyển hướng Tự động
    useEffect(()=>{
       if(nextUrl){
        setTimeout(() => {
            navigate(`/${nextUrl}`)
        }, 5000);
       }
    }, [nextUrl])

  return (
    // GIao diện người dùng 
    <div className='flexCenter h-screen'>
        <div className='animate-spin rounded-full h-24 w-24 border-4 border-gray-300 border-t-secondary'/>
    </div>
  )
}
// Component Loading này cung cấp trải nghiệm tải trang tạm thời cho người dùng 
// tự động chuyển hướng họ đến trang đích sau một độ trễ 5 giây
export default Loading