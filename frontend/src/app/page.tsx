'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { OnboardingImage } from '@/components/OnboardingImage';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/home');
    }
  }, [session, router, loading]);

  if (loading || session) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  const features = [
    {
      title: "Smart Recipe Suggestions",
      description: "Get personalized recipe recommendations based on what's in your pantry",
      icon: "✨",
      imagePath: { section: 'recipes' as const, image: 'generated' as const }
    },
    {
      title: "Receipt Scanning",
      description: "Quickly add items by scanning your grocery receipts",
      icon: "🧾",
      imagePath: { section: 'receipt' as const, image: 'upload' as const }
    },
    {
      title: "Ingredient Tracking",
      description: "Keep track of your pantry and automatically update quantities when you cook",
      icon: "📦",
      imagePath: { section: 'usage' as const, image: 'pantryUpdate' as const }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-6"
        >
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/images/zoomed_elf.png"
              alt="Kitchen Elf Logo"
              width={40}
              height={40}
              className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
              priority
            />
            <h1 className="text-4xl sm:text-5xl font-bold">Kitchen Elf</h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto flex flex-col items-center gap-1">
            <span>AI-powered recipes from your pantry.</span>
            <span>Save Time.</span>
            <span>Waste Less.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transform hover:scale-105 transition-all font-medium"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
              >
                Login
              </Link>
            </div>
            
            <a
              href="https://apps.apple.com/us/app/kitchen-elf/id6739987145"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img 
                src="/images/app-store-badge.svg" 
                alt="Download Kitchen Elf on the App Store" 
                className="h-[44px]"
              />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-gray-900 rounded-xl p-6 space-y-4"
            >
              <div className="text-3xl">{feature.icon}</div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
              <OnboardingImage
                section={feature.imagePath.section}
                image={feature.imagePath.image}
                alt={feature.title}
                className="border border-gray-800 rounded-lg"
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-4 gap-8 text-center">
        {[
          { stat: '100+', label: 'Recipes Generated' },
          { stat: '10+', label: 'Happy Cooks' },
          { stat: '10 mins', label: 'Saved per Meal' },
          { stat: '10%', label: 'Less Food Waste' },
        ].map(({ stat, label }) => (
          <div key={label} className="space-y-2">
            <p className="text-3xl font-bold text-blue-500">{stat}</p>
            <p className="text-gray-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
