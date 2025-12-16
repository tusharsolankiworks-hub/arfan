
import React, { useState } from 'react';

const AboutUs: React.FC = () => {
  // Reliable built-in placeholder to ensure visibility if local file is missing
  const FALLBACK_PROFILE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ccircle cx='100' cy='85' r='35' fill='%2364748b'/%3E%3Cpath d='M100 130c-40 0-60 30-60 30v10h120v-10s-20-30-60-30z' fill='%2364748b'/%3E%3C/svg%3E";

  // Use the local image.png if available, otherwise fallback. 
  // removed localStorage logic to ensure the "Designer Photo" is the permanent source of truth.
  const [imgSrc, setImgSrc] = useState("/image.png");
  
  const handleImgError = () => {
    if (imgSrc !== FALLBACK_PROFILE) {
        setImgSrc(FALLBACK_PROFILE);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-10">
      {/* Hero Section */}
      <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-6">
          About SMART PDF (AI)
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
          Redefining document management with <span className="font-bold text-indigo-600">GenAI</span> intelligence and <span className="font-bold text-green-600">Client-Side</span> privacy.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-white p-10 rounded-3xl shadow-xl mb-12 text-center relative overflow-hidden">
         {/* Decorative background elements */}
         <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
         <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-pink-500 rounded-full opacity-20 blur-3xl"></div>
         
         <h2 className="text-3xl font-bold mb-6 relative z-10">Our Mission</h2>
         <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed relative z-10">
            We believe powerful tools should be accessible to everyone without compromising privacy. 
            By harnessing the power of <strong>Google Gemini AI</strong> and modern browser technologies like <strong>WebAssembly</strong>, 
            we've built a suite of PDF tools that runs entirely on your device—secure, fast, and free.
         </p>
      </div>

      {/* Core Values Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <FeatureCard 
          title="Privacy First Architecture" 
          icon="🔒"
          color="green"
          description="Unlike other online editors, we do not upload your files to a server for general processing. Operations like merging, compressing, and editing happen locally in your browser using WebAssembly."
        />
        <FeatureCard 
          title="AI-Powered Intelligence" 
          icon="✨"
          color="purple"
          description="We integrate Google's Gemini 2.5 Flash model to understand your documents—summarizing content, fixing grammar, and performing advanced OCR extraction."
        />
        <FeatureCard 
          title="Desktop-Class Performance" 
          icon="⚡"
          color="blue"
          description="Built with React 19 and optimized PDF.js, experience lag-free editing, rendering, and conversion regardless of your device or operating system."
        />
        <FeatureCard 
          title="Comprehensive Toolkit" 
          icon="🛠"
          color="orange"
          description="From simple merging and splitting to complex form filling and digital signatures. One unified platform for all your document needs."
        />
      </div>

      {/* Designer Section (Integrated) */}
      <div className="w-full flex justify-center px-4 mb-10">
          <div className="w-full max-w-3xl bg-gradient-to-br from-pink-500 to-rose-600 p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(236,72,153,0.3)] flex flex-col items-center text-center relative overflow-hidden group">
              
              {/* Glossy Overlay Effect */}
              <div className="absolute inset-0 bg-white/5 pointer-events-none group-hover:bg-white/10 transition-colors duration-500"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              
              {/* Quote */}
              <div className="relative bg-white/95 p-6 rounded-2xl shadow-lg mb-10 transform -rotate-1 w-full max-w-xl border border-white/50">
                  <p className="font-serif font-bold text-gray-800 text-xl italic leading-relaxed">
                    "Thinking is the capital, Enterprise is the way, Hard work is the solution"
                  </p>
              </div>
              
              {/* Profile Card */}
              <div className="relative flex flex-col md:flex-row items-center bg-white/95 backdrop-blur-md p-5 pr-10 rounded-full shadow-2xl transform hover:scale-105 transition-transform duration-300 border border-white/40">
                  
                  {/* Static Image Container */}
                  <div className="relative shrink-0">
                    <img 
                        src={imgSrc} 
                        alt="Md Arfan Choudhary" 
                        onError={handleImgError}
                        className="w-24 h-24 rounded-full object-cover border-[6px] border-white shadow-lg bg-gray-50"
                        crossOrigin="anonymous"
                    />
                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1.5 border-4 border-white shadow-sm pointer-events-none" title="Verified Creator">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  </div>
                  
                  <div className="mt-3 md:mt-0 md:ml-6 flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className="font-black text-gray-900 text-2xl leading-none mb-1">Md Arfan Choudhary</h3> 
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm mb-3">
                      Designer & Developer
                    </span>
                    <div className="flex gap-3">
                        <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
                        <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
                    </div>
                  </div> 
              </div> 
          </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, icon, description, color }: any) => {
  const colorClasses: any = {
    green: 'bg-green-50 border-green-100 text-green-800',
    purple: 'bg-purple-50 border-purple-100 text-purple-800',
    blue: 'bg-blue-50 border-blue-100 text-blue-800',
    orange: 'bg-orange-50 border-orange-100 text-orange-800',
  };
  
  return (
    <div className={`p-8 rounded-2xl border ${colorClasses[color]} transition hover:-translate-y-1 duration-300 shadow-sm hover:shadow-md`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="opacity-90 leading-relaxed">{description}</p>
    </div>
  );
};

export default AboutUs;
