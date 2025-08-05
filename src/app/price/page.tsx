'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';

// Dynamically import Galaxy to avoid SSR issues
const Galaxy = dynamic(() => import('@/components/Galaxy'), { ssr: false });

export default function PricePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const plans = [
    {
      name: "Celestial Seeker",
      subtitle: "Basic Membership",
      price: "$9.99",
      period: "/month",
      features: [
        "Basic natal chart analysis",
        "Monthly newsletter with celestial insights",
        "Member-only discounts on special readings and services"
      ],
      buttonText: "Subscribe Now",
      popular: false
    },
    {
      name: "Celestial Explorer",
      subtitle: "Premium Membership", 
      price: "$19.99",
      period: "/month",
      features: [
        "All features of the Celestial Seeker plan",
        "Access to daily horoscopes",
        "Exclusive early access to monthly astrological forecasts"
      ],
      buttonText: "Subscribe Now",
      popular: true
    },
    {
      name: "Celestial Visionary",
      subtitle: "VIP Membership",
      price: "$49.99", 
      period: "/month",
      features: [
        "All features of the Celestial Explorer plan",
        "Exclusive access to webinars and workshops",
        "Personalized monthly guidance sessions with a professional astrologer"
      ],
      buttonText: "Subscribe Now",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-black text-foreground relative overflow-hidden">
      {/* Galaxy background */}
      <div className="absolute inset-0">
        {mounted && (
          <Galaxy
            mouseInteraction={true}
            speed={0.6}
            density={2}
            glowIntensity={0.2}
            rotationSpeed={0.05}
          />
        )}
      </div>

      <Header />

      {/* Main content */}
      <main className="relative z-10 py-20 px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            <p className="text-white text-sm font-medium uppercase tracking-wider mb-4">
              PRICING PLAN
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 text-white">
              Check Our <span className="text-primary italic">Membership Plan</span>
            </h1>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-3xl border border-border p-8 bg-card/20 backdrop-blur-sm ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-accent text-accent-foreground px-6 py-2 rounded-full text-sm font-medium">
                      Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-serif mb-2 text-white">{plan.name}</h3>
                  <p className="text-white text-sm font-medium">{plan.subtitle}</p>
                </div>

                {/* Features */}
                <div className="mb-8 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="text-center">
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white italic ml-1">{plan.period}</span>
                  </div>
                </div>

                {/* Subscribe Button */}
                <div className="text-center">
                  <button
                    className={`w-full py-3 px-6 rounded-full font-medium transition-opacity ${
                      plan.popular
                        ? 'bg-primary text-white hover:opacity-90'
                        : 'border border-gray-600 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}