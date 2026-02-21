import React from 'react';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <div className="bg-white py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1E3A8A] rounded-3xl shadow-xl overflow-hidden relative">
          
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>

          <div className="px-6 py-12 md:py-20 text-center relative z-10">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to Make a Difference?
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              Join thousands of citizens improving their communities through transparent civic engagement.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="inline-flex rounded-md shadow">
                <a
                  href="#"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-[#1E3A8A] bg-white hover:bg-blue-50 transition-colors"
                >
                  Report Your First Issue
                  <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;