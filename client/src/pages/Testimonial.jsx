// hiển thị phần lời chứng thực/đánh giá của khách hàng
// sử dụng dữ liệu tĩnh để trình bày các đánh giá theo một bố cục card đẹp mắt và đáp ứng.
import React from "react";
import { FaStar } from "react-icons/fa";
import Title from "../components/Title";
import user1 from "../assets/testimonials/user1.jpg"
import user2 from "../assets/testimonials/user2.jpg"
import user3 from "../assets/testimonials/user3.jpg"

// Dữ liệu được lưu trữ trong một mảng hằng số, bao gồm thông tin chi tiết cho 3 lời chứng thực mẫu:
const testimonials = [
  {
    name: "Donald Jackman",
    date: "22 Jan 2025",
    message:
      "“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.”",
    image:user1,
  },
  {
    name: "Michael Lee",
    date: "10 Mar 2025",
    message:
      "“Fantastic experience overall. Support was helpful and the delivery time was impressive. Highly recommended.”",
    image:user2,
  },
  {
    name: "Sarah Thomas",
    date: "14 Feb 2025",
    message:
      "“This service completely exceeded my expectations. The process was smooth and the result outstanding!”",
    image:user3,
  },
  
];

// Giao diện người dùng
const Testimonial = () => {
  return (
    <div className="max-padd-container py-16 pt-28 bg-primary">
      <Title
        title1={"People"}
        title2={"Says"}
        titleStyles={"pb-10"}
        paraStyles={"!block"}
        para={"Real stories from our happy customers sharing their experience, style inspiration, and trusted feedback on what they love."}
      />
      <div className="flex flex-wrap gap-6 pb-12">
        {/* Hiển thị Các Card Đánh giá */}
        {/* Phần này sử dụng vòng lặp testimonials.map() để render từng lời chứng thực trong một card riêng biệt. */}
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white w-full max-w-[422px] space-y-4 p-3 border border-gray-300/60 text-gray-500 text-sm"
          >
            {/* Đánh giá sao và ngày tháng */}
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} size={16} className="text-[#FF532E]" />
                ))}
              </div>
              <p>{testimonial.date}</p>
            </div>

            {/* Nội dung đánh giá và thông tin người dùng - Hiển thị thông điệp của khách hàng ({testimonial.message}). */}
            <p>{testimonial.message}</p>

            <div className="flex items-center gap-2">
              <img
              // Thông tin người dùng
                className="h-8 w-8 rounded-full"
                src={testimonial.image}
                alt={testimonial.name}
              />
              <p className="text-gray-800 font-medium">{testimonial.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonial;
