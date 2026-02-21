import React from 'react';
import { FileText, Target, BarChart3, Star } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      id: '01',
      title: 'Report Issue',
      description: 'Submit your civic complaint with photos and location details instantly.',
      icon: FileText,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      id: '02',
      title: 'Track Progress',
      description: 'Monitor real-time updates as your issue moves towards resolution.',
      icon: BarChart3,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      id: '03',
      title: 'Verify & Rate',
      description: 'Confirm resolution and provide feedback on the quality of service.',
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
  ];

  return (
    <div className="py-20 bg-gray-50" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How CivicTrack Works
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Simple, transparent, and effective civic issue management in 4 easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              
              <span className="text-sm font-bold text-gray-400 block mb-4">
                {step.id}
              </span>

              <div className={`w-14 h-14 ${step.bg} rounded-xl flex items-center justify-center mb-6`}>
                <step.icon className={`w-7 h-7 ${step.color}`} />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default HowItWorks;