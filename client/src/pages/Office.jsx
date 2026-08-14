import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import OfficeCanvas from "../components/OfficeCanvas";

function Office() {
  return (
    <div className="h-screen bg-slate-950 flex flex-col">

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar />

        {/* Office Canvas */}
        <OfficeCanvas />

      </div>

    </div>
  );
}

export default Office;