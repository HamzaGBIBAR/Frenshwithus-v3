import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white transition-colors duration-500 dark:bg-[#111111] font-inter text-text dark:text-[#f5f5f5]">
      <Navbar />
      
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Terms of Service</h1>
            <p className="text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p>
              By accessing and using FrenchWithUs, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">1. Provision of Services</h2>
            <p>
              FrenchWithUs is constantly innovating in order to provide the best possible experience for its users. You acknowledge and agree that the form and nature of the services which FrenchWithUs provides may change from time to time without prior notice to you.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">2. User Account and Security</h2>
            <p>
              In order to access certain services, you may be required to provide information about yourself (such as identification or contact details) as part of the registration process for the service, or as part of your continued use of the services. You agree that any registration information you give to FrenchWithUs will always be accurate, correct and up to date.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of passwords associated with any account you use to access the services. Accordingly, you agree that you will be solely responsible to FrenchWithUs for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">3. Acceptable Use</h2>
            <p>
              You agree to use the services only for purposes that are permitted by (a) the Terms and (b) any applicable law, regulation or generally accepted practices or guidelines in the relevant jurisdictions.
            </p>
            <p>
              You agree not to access (or attempt to access) any of the services by any means other than through the interface that is provided by FrenchWithUs, unless you have been specifically allowed to do so in a separate agreement.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">4. Content in the Services</h2>
            <p>
              You understand that all information (such as data files, written text, computer software, music, audio files or other sounds, photographs, videos or other images) which you may have access to as part of, or through your use of, the services are the sole responsibility of the person from which such content originated.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">5. Intellectual Property Rights</h2>
            <p>
              Unless otherwise agreed in writing, nothing in the Terms gives you a right to use any of FrenchWithUs's trade names, trademarks, service marks, logos, domain names, and other distinctive brand features.
            </p>

             <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-medium mb-2">Questions?</h3>
              <p className="mb-0">
                If you have any questions about our Terms of Service, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
