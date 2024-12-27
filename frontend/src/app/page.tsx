'use client';

import { motion } from 'framer-motion';
import { OnboardingImage } from '@/components/OnboardingImage';
import Link from 'next/link';

export default function LandingPage() {
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
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="text-5xl font-bold">Kitchen Elf</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your AI-powered kitchen assistant that helps you manage your pantry and discover recipes you can make right now.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Sign In
            </Link>
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
    </div>
  );
}
