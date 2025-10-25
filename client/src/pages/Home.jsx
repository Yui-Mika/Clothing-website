import React from 'react'
import Hero from '../components/Hero'
import Categories from '../components/Categories'
import Features from '../components/Features'
import PopularProducts from '../components/PopularProducts'
import banner from "../assets/banner.png"
import Blog from '../components/Blog'

const Home = () => {
  return (
    <>
    <Hero />
    <Features />
    <Categories />
    <PopularProducts />
    <div className="max-padd-container lg:py-8 overflow-hidden">
      <img src={banner} alt="" className="rounded min-w-[711px] w-full max-w-none object-cover"
      />
    </div>
    <Blog />
    </>
  )
}

export default Home