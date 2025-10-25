// Điểm Khởi Đầu (Entry Point) duy nhất của toàn bộ ứng dụng React.
// Có 2 nhiệm vụ chính:
// 1. Kết nối ứng dụng React với DOM của trình duyệt.
// 2. Bao bọc ứng dụng trong các nhà cung cấp (Providers) cần thiết như Router và Context để quản lý trạng thái toàn cục.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ShopContextProvider from "./context/ShopContext.jsx";

/* Tìm kiếm một thẻ HTML (thường là một <div id="root"> trống) 
trong file index.html của bạn. Đây là nơi toàn bộ ứng dụng React sẽ được chèn vào. */ 
createRoot(document.getElementById("root")).render(
  // bao bọc <App /> là cung cấp các tính năng cốt lõi cho mọi component con bên dưới nó
  <BrowserRouter>
    <ShopContextProvider>
      <App /> {/* Đây là component chính chứa tất cả logic bố cục và các tuyến đường (routes) của bạn. 
      Nó là "ngôi nhà" của bạn, được xây dựng trên "nền móng" của Context và Router. */}
    </ShopContextProvider>
  </BrowserRouter>
);
