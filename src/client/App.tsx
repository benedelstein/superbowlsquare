import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Group from "./pages/Group";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/groups/:name" element={<Group />} />
      </Routes>
    </div>
  );
}
