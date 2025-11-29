// src/App.tsx
import { Outlet } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* sem môže ísť topbar / sidebar spoločné pre všetky stránky */}
      <Outlet />
    </div>
  );
}

export default App;
