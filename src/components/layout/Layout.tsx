import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Dashboard from "../../pages/Dashboard";
import Upload from "../../pages/Upload";
import Documents from "../../pages/Documents";
import Search from "../../pages/Search";
import Settings from "../../pages/Settings";
import NotFound from "../../pages/NotFound";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

export default Layout;