import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                CrimsonBites collects the following information to provide nutrition tracking services:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Email address and name (when you register or use Google OAuth)</li>
                <li>Nutrition and meal tracking data you voluntarily input</li>
                <li>Profile information including dietary preferences and goals</li>
                <li>Usage analytics to improve our service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Provide personalized nutrition tracking and recommendations</li>
                <li>Maintain your account and preferences</li>
                <li>Send important service notifications</li>
                <li>Improve our application features and user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or share your personal information with third parties, except:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>When required by law or legal process</li>
                <li>To protect the safety and security of our users</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Encrypted data transmission (HTTPS)</li>
                <li>Secure authentication with JWT tokens</li>
                <li>Regular security updates and monitoring</li>
                <li>Limited access to personal data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Google OAuth</h2>
              <p className="text-gray-700 mb-4">
                When you sign in with Google, we only access:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Your email address</li>
                <li>Your public profile name</li>
                <li>Basic profile information</li>
              </ul>
              <p className="text-gray-700 mb-4">
                We do not access your Google account data beyond what's necessary for authentication.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your account information as long as your account is active or as needed to provide services. 
                You may delete your account at any time through your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Export your nutrition tracking data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700 mb-4">
                Email: privacy@crimsonbites.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify users of any material 
                changes by posting the new Privacy Policy on this page and updating the effective date.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;