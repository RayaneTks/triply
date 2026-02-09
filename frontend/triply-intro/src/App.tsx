import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Storybook from "./pages/Storybook.tsx";
import Roadmap from "./pages/Roadmap";
import Git from "./pages/Git.tsx";
import TeamCharPage from "./pages/TeamCharPage.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Powerpoint from "./pages/Powerpoint.tsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/storybook" element={<Storybook />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/git" element={<Git />} />
                <Route path="/teamchar" element={<TeamCharPage />} />
                <Route path="/powerpoint" element={<Powerpoint />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}
