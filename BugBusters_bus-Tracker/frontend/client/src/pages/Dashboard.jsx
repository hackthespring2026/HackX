import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import BusInfoCard from "../components/BusInfoCard";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#98C1D9]/40 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#A8CCE0]/20 border-b border-[#7DAEC7] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          
          <h1 className="text-xl font-semibold text-gray-800">
            Track your bus here...
          </h1>

          <div className="w-full max-w-md">
            <SearchBar />
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Map Section */}
          <div className="lg:col-span-3 bg-[#F8FBFD] rounded-3xl border border-[#7DAEC7] shadow-sm overflow-hidden relative">

            <div className="h-[500px] lg:h-[650px]">
              <MapView />
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-3">
              <button className="w-12 h-12 bg-white border border-[#7DAEC7] rounded-full shadow-sm hover:bg-[#A8CCE0] transition">
                📍
              </button>
              <button className="w-12 h-12 bg-white border border-[#7DAEC7] rounded-full shadow-sm hover:bg-[#A8CCE0] transition">
                🔄
              </button>
            </div>

          </div>

          {/* Side Panel */}
          <aside className="bg-[#A8CCE0] rounded-3xl border border-[#7DAEC7] shadow-sm p-6 flex flex-col">

            {/* Routes */}
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Routes
              </h2>

             
            </div>


            {/* Bus List */}
            <div className="flex-1 overflow-y-auto space-y-4">
              <BusInfoCard />
            </div>

          </aside>

        </div>

      </main>
    </div>
  );
};

export default Dashboard;