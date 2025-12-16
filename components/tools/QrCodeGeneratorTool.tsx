import React from 'react';
import QrGenerator from '../QrGenerator';

const QrCodeGeneratorTool: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-800 mb-2">QR Code Generator</h1>
            <p className="text-gray-500">Create permanent, free, high-quality QR codes. No sign-up required.</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-[600px]">
            <QrGenerator />
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-gray-600">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-2">Forever Free</h3>
                <p className="text-sm">Static QR codes never expire. Create as many as you need.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-2">No Scan Limits</h3>
                <p className="text-sm">Your codes can be scanned an unlimited number of times.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-2">High Resolution</h3>
                <p className="text-sm">Print-ready PNGs suitable for marketing materials.</p>
            </div>
        </div>
    </div>
  );
};

export default QrCodeGeneratorTool;