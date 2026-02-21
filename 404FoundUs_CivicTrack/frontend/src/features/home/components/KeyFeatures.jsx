import React from 'react';
import { Clock, Shield, CheckCircle } from 'lucide-react';

const KeyFeatures = () => {
  const features = [
    {
      name: 'Real-time Tracking',
      description: 'Monitor your complaint status with live updates at every stage of resolution.',
      icon: Clock,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      name: 'Transparent Status',
      description: 'Complete visibility into the resolution process with timeline tracking.',
      icon: Shield,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      name: 'Verified Resolution',
      description: 'Photo proof and citizen feedback ensure issues are properly resolved.',
      icon: CheckCircle,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
    },
  ];

  return (
    <div className="py-16 bg-white " id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} aria-hidden="true" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.name}
              </h3>
              
              <p className="text-gray-500 text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyFeatures;