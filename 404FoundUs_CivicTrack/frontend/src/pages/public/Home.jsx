import React from 'react';
import HomeIntroSection from '../../features/home/components/HomeIntroSection';
import KeyFeatures from '../../features/home/components/KeyFeatures';
import HowItWorks from '../../features/home/components/HowItWorks';
import CTASection from '../../features/home/components/CTASection';

const Home = () => {
  return (
    <div id="home-page">
      <HomeIntroSection />
      <KeyFeatures />
      <HowItWorks />
    </div>
  );
};

export default Home;