'use client';


export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Kitchen Elf Support</h1>
        
        <div className="space-y-8">
          {/* Contact Section */}
          <section className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-4">
              Need help with Kitchen Elf? We are here to assist you.
            </p>
            <p className="text-gray-300">
              Email: anshul.tibrewal2203@gmail.com
            </p>
          </section>

          {/* FAQ Section */}
          <section className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-blue-400 mb-2">
                  How do I scan receipts?
                </h3>
                <p className="text-gray-300">
                  Tap the camera icon in your pantry tab to scan a receipt. You can either take a photo or upload one from your library.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-400 mb-2">
                  How do I generate recipes?
                </h3>
                <p className="text-gray-300">
                  Click the floating elf button in the recipes tab to set your preferences and generate personalized recipes.
                </p>
              </div>
              {/* Add more FAQs as needed */}
            </div>
          </section>

          {/* App Information */}
          <section className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">App Information</h2>
            <div className="text-gray-300">
              <p>Version: 1.06</p>
              <p>Last Updated: {new Date().toLocaleDateString()}</p>
              <p>
                <a 
                  href="https://www.termsfeed.com/live/96813293-4d1c-41e9-8fb8-be05e7898ba9"
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
