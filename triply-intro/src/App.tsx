import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Storybook from "./pages/Storybook.tsx";
import Roadmap from "./pages/Roadmap";
import Contact from "./pages/Contact";
import TeamCharPage from "./pages/TeamCharPage.tsx";
import AboutUs from "./pages/AboutUs.tsx";
import Dashboard from "./pages/Dashboard.tsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<Storybook />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/teamchar" element={<TeamCharPage />} />
                <Route path="/aboutus" element={<AboutUs />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}
