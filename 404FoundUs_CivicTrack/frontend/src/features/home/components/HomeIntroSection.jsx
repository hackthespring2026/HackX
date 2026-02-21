import React , { Suspense , lazy } from 'react';
import { ArrowRight, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
const Spline = lazy(() => import('@splinetool/react-spline'));

const HomeIntroSection = () => {

  return (
    <div className="relative bg-gradient-to-b from-slate-50 via-slate-50 to-white overflow-hidden min-h-screen flex flex-col lg:block">
      
      <div className="absolute top-0 left-0 w-full h-full bg-white opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100 blur-[120px] opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto w-full h-full relative z-20">
        <div className="relative pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-10 h-full flex flex-col justify-center">
          
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-8 sm:px-6 md:mt-16 lg:mt-0 lg:px-6 xl:mt-28">
            <div className="sm:text-center lg:text-left">

              <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl mb-6">
                <span className="block xl:inline">Report Civic Issues.</span>{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0F5C86] to-blue-500">
                  Track Resolution.
                </span>
              </h1>
              
              <p className="mt-3 text-base text-slate-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 leading-relaxed">
                Empower your community with a transparent, digital grievance redressal system. Submit complaints, monitor status, and ensure municipal accountability in real-time.
              </p>
              
              <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start gap-4">
                <div className="rounded-md shadow-lg shadow-blue-900/20">
                  <Link 
                    to="/dashboard/report" 
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#1E3A8A] hover:bg-[#152C6F] md:py-4 md:text-lg md:px-10 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Report an Issue <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0">
                  <Link 
                    to="/dashboard"
                    className="w-full flex items-center justify-center px-8 py-3 border border-slate-200 text-base font-medium rounded-lg text-[#0F5C86] bg-white hover:bg-slate-50 md:py-4 md:text-lg md:px-10 transition-colors shadow-sm"
                  >
                    View Live Dashboard
                  </Link>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 pt-8 relative z-20 pr-4 pb-12">
                <div className="flex flex-col">
                  <div className="flex items-center text-3xl font-bold text-slate-900">
                    1,247 <CheckCircle className="w-5 h-5 ml-2 text-green-500 opacity-50" />
                  </div>
                  <div className="text-sm font-medium text-slate-500 mt-1">Issues Resolved</div>
                </div>
                <div>
                  <div className="flex items-center text-3xl font-bold text-slate-900">
                    3.2 <Clock className="w-5 h-5 ml-2 text-blue-500 opacity-50" />
                  </div>
                  <div className="text-sm font-medium text-slate-500 mt-1">Days Avg Response</div>
                </div>
                <div>
                  <div className="flex items-center text-3xl font-bold text-slate-900">
                    98% <BarChart3 className="w-5 h-5 ml-2 text-purple-500 opacity-50" />
                  </div>
                  <div className="text-sm font-medium text-slate-500 mt-1">Citizen Satisfaction</div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
      
      <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-[80%] h-[500px] lg:h-full z-0">        
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent z-10 pointer-events-none hidden lg:block"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
        <div
          className="w-full h-full flex left-1"
          onWheel={(e) => e.preventDefault()}
        >
          <img src="../../HeroImage.jpeg" alt="" />
        </div>
      </div>
    </div>
  );
};

export default HomeIntroSection;