import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-lg animate-fade-in border border-gray-100">
       <div className="text-center mb-12 border-b border-gray-100 pb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-10 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
            Introduction
          </h2>
          <p>
            Welcome to <strong>SMART PDF (AI)</strong>. We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
             <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
             How We Handle Your Files
          </h2>
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-6">
            <p className="font-bold text-green-900 text-lg mb-1">Core Promise: Client-Side Processing</p>
            <p className="text-green-800">We do not store your files on our servers.</p>
          </div>
          <p className="mb-4">
            SMART PDF (AI) operates differently from most online PDF tools. We utilize <strong>Client-Side Processing</strong> technology (WebAssembly). 
            This means that when you select a file to merge, compress, split, or edit, the file processing occurs directly 
            within your web browser's memory on your own device.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600 bg-gray-50 p-4 rounded-lg">
            <li>We <strong>do not</strong> upload your PDF files to our backend servers for general editing or manipulation.</li>
            <li>We <strong>do not</strong> store copies of your documents in any database.</li>
            <li>Once you close the tab or refresh the page, the file data is immediately cleared from your browser's memory.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">3</span>
            AI Features & Data Usage
          </h2>
          <p className="mb-4">
            For specific features labeled with "AI" (such as <em>AI Summary, OCR, AI Proofreading, or Auto-Tagging</em>), 
            we utilize the <strong>Google Gemini API</strong>.
          </p>
          <p className="mb-2 font-semibold">When you use these specific features:</p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-gray-600">
            <li>The specific text or image content required for the task is sent securely to Google's servers for processing via the API.</li>
            <li>This data is transient and is used solely to provide the generated response (e.g., the summary or corrected text).</li>
            <li>We do not retain this data.</li>
            <li>Please refer to <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google's Privacy Policy</a> for details on how they handle API data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gray-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">4</span>
            Information We Collect
          </h2>
          <p>
            Since we do not require user accounts, we collect minimal data:
          </p>
          <ul className="list-disc list-inside mt-4 ml-4 space-y-2">
            <li><strong>Usage Data:</strong> We may collect anonymous metrics (e.g., which tools are used most frequently) to improve the application.</li>
            <li><strong>Device Information:</strong> Basic information about your browser type to ensure compatibility.</li>
            <li><strong>Local Storage:</strong> We use your browser's local storage to save your preferences (like theme settings) if applicable.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gray-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">5</span>
            Third-Party Services
          </h2>
          <p>
            This application uses third-party open-source libraries (such as PDF.js, pdf-lib, Tesseract.js) delivered via CDNs (Content Delivery Networks). 
            These providers may collect standard web traffic logs (IP addresses) for security and performance monitoring.
          </p>
        </section>

        <section className="pt-6 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at <a href="mailto:support@smartpdfai.com" className="text-blue-600 font-medium hover:underline">support@smartpdfai.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;