import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Courses from "./pages/student/Courses";
//import Repositories from "./pages/Repositories";
import NotFound from "./pages/NotFound";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        {/* SIDEBAR */}
        <Sidebar />

        {/* CONTENIDO */}
        <div className="flex-1 overflow-auto p-6 bg-neutral-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/cursos" element={<Courses />} />

            {/* Ruta por defecto */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
