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
  const { session, loading, signInAnonymously } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/home');
    }
  }, [session, router, loading]);

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously();
    } catch (error) {
      console.error('Failed to sign in anonymously:', error);
    }
  };

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

  const HeroSection = () => {
    return (
      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-16 text-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative space-y-8"
        >
          {/* Logo and title */}
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/images/zoomed_elf.png"
              alt="Kitchen Elf Logo"
              width={50}
              height={50}
              className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px]"
              priority
            />
            <h1 className="text-5xl sm:text-6xl font-bold">Kitchen Elf</h1>
          </div>

          {/* Tagline with staggered animation */}
          <motion.p 
            className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto flex flex-col items-center gap-2"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.12 } }
            }}
          >
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              AI-powered recipes from your pantry.
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              Save Time. Waste Less. Save Money.
            </motion.span>
          </motion.p>

          {/* Action buttons */}
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transform hover:scale-105 transition-all font-medium shadow-lg shadow-blue-500/20"
              >
                Sign up
              </Link>
              <button
                onClick={handleAnonymousSignIn}
                className="px-8 py-4 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-all"
              >
                Try as guest
              </button>
            </div>
            
            <Link
              href="/login"
              className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
            >
              Login
            </Link>
            
            <a
              href="https://apps.apple.com/us/app/kitchen-elf/id6739987145"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80 mt-2"
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <HeroSection />

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
