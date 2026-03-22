import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white transition-colors duration-500 dark:bg-[#111111] font-inter text-text dark:text-[#f5f5f5]">
      <Navbar />
      
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Privacy Policy</h1>
            <p className="text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p>
              Welcome to FrenchWithUs. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website 
              (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">1. Important information and who we are</h2>
            <p>
              This privacy policy aims to give you information on how FrenchWithUs collects and processes your personal data through your use of this website, including any data you may provide through this website when you sign up for a course, purchase a lesson, or take part in a live session.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">2. The data we collect about you</h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
              <li><strong>Financial Data</strong> includes payment card details (processed securely by our payment providers).</li>
              <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">3. How we use your personal data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">4. Data security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-black dark:text-white">5. Your legal rights</h2>
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data. You have the right to request access, correction, erasure, restriction, transfer, or to object to processing of your personal data.
            </p>

            <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-medium mb-2">Contact Us</h3>
              <p className="mb-0">
                If you have any questions about this privacy policy or our privacy practices, please contact our data privacy manager in the Contact section of our website.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
