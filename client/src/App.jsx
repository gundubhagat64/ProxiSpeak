import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Office from "./pages/Office";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/office" element={<Office />} />
    </Routes>
  );
}

export default App;