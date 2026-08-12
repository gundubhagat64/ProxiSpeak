import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import OfficeCanvas from "../components/OfficeCanvas";

function Office() {
  return (
    <div className="h-screen bg-slate-950">
      <Navbar />

      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar />
        <OfficeCanvas />
      </div>
    </div>
  );
}

export default Office;