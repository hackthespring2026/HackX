'use client';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Zap, Shield, BarChart3, MessageSquare, Star, ArrowRight, TrendingUp, Users, Briefcase } from 'lucide-react';

export default function Home() {
  const { user } = useSelector(state => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    }
  }, [user]);

  return (
    <div className="min-h-screen mesh-bg overflow-hidden">
      {/* Nav */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            
            <span className="text-3xl font-bold gradient-text">Unify</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors text-sm">
              Login
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass-light rounded-full px-4 py-2 text-sm text-primary-500 mb-8 animate-fade-in">
            <Zap size={14} />
            <span>AI-Powered Creator Analytics</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            Where <span className="gradient-text">Brands</span> Meet<br />
            <span className="gradient-text">Authentic</span> Creators
          </h1>
          
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-powered marketplace with fake follower detection, smart analytics, 
            and seamless campaign management. No fake metrics, just real results.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register?role=brand" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              <Briefcase size={20} />
              I'm a Brand
            </Link>
            <Link href="/auth/register?role=creator" className="btn-accent flex items-center gap-2 text-lg px-8 py-4">
              <Star size={20} />
              I'm a Creator
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20">
            {[
              { icon: Users, value: '10K+', label: 'Verified Creators' },
              { icon: Briefcase, value: '2K+', label: 'Active Campaigns' },
              { icon: TrendingUp, value: '₹50Cr+', label: 'Deals Closed' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="glass rounded-2xl p-6 text-center card-hover">
                <Icon size={24} className="text-primary-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-gray-500 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Why <span className="gradient-text">Unify</span>?</h2>
          <p className="text-gray-400 text-center mb-16">Everything you need for successful brand-creator collaborations</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'AI Fake Detection',
                desc: 'Advanced ML algorithms detect fake followers and suspicious engagement patterns instantly.',
                color: 'text-blue-400'
              },
              {
                icon: BarChart3,
                title: 'Deep Analytics',
                desc: 'Engagement rate, audience demographics, content consistency score and more.',
                color: 'text-purple-400'
              },
              {
                icon: Zap,
                title: 'Smart Matching',
                desc: 'Filter creators by niche, platform, followers, location, and engagement rate.',
                color: 'text-yellow-400'
              },
              {
                icon: MessageSquare,
                title: 'Direct Chat',
                desc: 'Real-time messaging, deal negotiation and collaboration management in one place.',
                color: 'text-green-400'
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass rounded-2xl p-6 card-hover">
                <div className={`w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center glow-blue">
          <h2 className="text-4xl font-bold mb-4">Ready to <span className="gradient-text">Collaborate</span>?</h2>
          <p className="text-gray-400 mb-8">Join thousands of brands and creators already on CollabBridge</p>
          <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Start For Free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 py-8 px-6 text-center text-gray-500 text-sm">
        <p>© 2026 Unify. All rights reserved by Innov8ors.</p>
      </footer>
    </div>
  );
}
