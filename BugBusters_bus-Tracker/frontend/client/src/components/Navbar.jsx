import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-[#A8CCE0] backdrop-blur-md border-b border-[#7DAEC7] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold text-[#1F2937] tracking-tight hover:opacity-80 transition-all duration-300"
        >
          Bus<span className="text-[#3D5A80]">Tracker</span>
        </Link>

        {/* Links */}
        <div className="flex items-center space-x-8 text-[#1F2937] font-medium">

          <Link
            to="/"
            className="relative group transition duration-300 text-sm uppercase tracking-widest"
          >
            <span className="group-hover:text-[#3D5A80] transition duration-300">
              Home
            </span>
            <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-[#3D5A80] transition-all duration-300 group-hover:w-full"></span>
          </Link>

          <Link
            to="/login"
            className="bg-[#84B4CE] text-white border border-[#7DAEC7] px-6 py-2 rounded-lg shadow-sm hover:bg-[#6EA5C4] transition-all duration-300 font-bold uppercase text-xs tracking-wider"
          >
            Login
          </Link>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;