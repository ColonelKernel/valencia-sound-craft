import { Outlet } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const ToolsLayout = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Outlet />
    <Footer />
  </div>
);

export default ToolsLayout;

