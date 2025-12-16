
import React from 'react';

const UserGuideTemplate: React.FC = () => {
  return (
    <div className="bg-white font-sans text-gray-900 p-12 mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* --- PAGE 1 --- */}
      <div className="relative h-[297mm] flex flex-col">
        {/* Header */}
        <div className="text-center pt-8 mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Master Your Documents
          </h1>
          <p className="text-xl text-gray-500 font-medium">
            Detailed instructions on how to use every feature in SMART PDF (AI).
          </p>
        </div>

        {/* 1. Edit & Modify */}
        <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                1. Edit & Modify (PDF Editor)
            </h2>
            <div className="flex gap-2 mb-6">
                <Pill text="PDF Editor" />
                <Pill text="Watermark" />
            </div>

            <div className="flex gap-8 mb-8">
                <div className="flex-1 bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">HOW TO USE</h3>
                    <ul className="space-y-5">
                        <Step number="1" text="Select 'PDF Editor' from the dashboard." />
                        <Step number="2" text="Upload your PDF file. The tool runs locally in your browser." />
                        <Step number="3" text="Click 'Text' to type, or use the signature/image tools." />
                        <Step number="4" text="Use 'Apply Changes' to bake your edits into a new PDF." />
                    </ul>
                </div>
                <div className="w-56 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <h3 className="text-xs font-bold text-gray-300 uppercase mb-4">PREVIEW</h3>
                    <div className="w-full h-24 bg-gray-50 rounded border border-gray-200 relative p-2">
                        <div className="h-1.5 bg-gray-200 w-3/4 rounded mb-1"></div>
                        <div className="h-1.5 bg-gray-200 w-full rounded mb-1"></div>
                        <div className="absolute top-8 left-4 text-[10px] bg-blue-100 text-blue-600 px-1 rounded border border-blue-200">Hel|</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <FeatureBox color="bg-blue-50" iconColor="bg-blue-100" title="ADD TEXT" sub="Type anywhere with custom fonts & colors." />
                <FeatureBox color="bg-green-50" iconColor="bg-green-100" title="INSERT IMAGE" sub="Place logos or photos on pages." />
                <FeatureBox color="bg-pink-50" iconColor="bg-red-100" title="WHITEOUT" sub="Erase sensitive info with white blocks." />
                <FeatureBox color="bg-indigo-50" iconColor="bg-indigo-100" title="E-SIGN" sub="Draw, type, or upload signatures." />
                <FeatureBox color="bg-yellow-50" iconColor="bg-yellow-100" title="STAMPS" sub='Add "Approved" or custom stamps.' />
                <FeatureBox color="bg-cyan-50" iconColor="bg-cyan-100" title="HYPERLINKS" sub="Make areas clickable links." />
                <FeatureBox color="bg-gray-50" iconColor="bg-gray-200" title="QR CODES" sub="Embed generated QR codes." />
                <FeatureBox color="bg-purple-50" iconColor="bg-purple-100" title="FIND/REPLACE" sub="Search and swap text content." />
            </div>
        </div>
      </div>

      {/* --- PAGE 2 --- */}
      <div className="html2pdf__page-break"></div>
      <div className="relative h-[297mm] flex flex-col pt-12">
        {/* 2. Photo Editing */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Photo Editing & AI Enhancement</h2>
            <div className="flex gap-2 mb-6">
                <Pill text="Photo Editor" />
                <Pill text="AI Enhancer" />
            </div>

            <div className="flex gap-8 mb-8">
                <div className="flex-1 bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">HOW TO USE</h3>
                    <ul className="space-y-5">
                        <Step number="1" text="Upload any image (JPG, PNG)." />
                        <Step number="2" text="Use 'AI Upscale' to boost resolution up to 4K." />
                        <Step number="3" text="Use 'Magic Scan' to detect blur and lighting issues." />
                        <Step number="4" text="Adjust brightness, contrast, and crop manually." />
                    </ul>
                </div>
                <div className="w-56 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                    <h3 className="text-xs font-bold text-gray-300 uppercase mb-4">PREVIEW</h3>
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-700 to-purple-800 shadow-md"></div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <FeatureBox color="bg-orange-50" iconColor="bg-orange-100" title="CROP & ROTATE" sub="Trim edges and change aspect ratio." />
                <FeatureBox color="bg-purple-50" iconColor="bg-purple-100" title="AI MAGIC" sub="Remove backgrounds & auto-fix." />
                <FeatureBox color="bg-teal-50" iconColor="bg-teal-100" title="PRO ADJUST" sub="Fine-tune brightness & contrast." />
                <FeatureBox color="bg-emerald-50" iconColor="bg-emerald-100" title="UPSCALE" sub="Increase resolution 4x with AI." />
            </div>
        </div>
      </div>

      {/* --- PAGE 3 --- */}
      <div className="html2pdf__page-break"></div>
      <div className="relative h-[297mm] flex flex-col pt-12 space-y-16">
        
        {/* 3. Organize */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Organize Documents</h2>
            <div className="flex gap-2 mb-6">
                <Pill text="Merge PDF" />
                <Pill text="Split PDF" />
                <Pill text="Image Merge" />
            </div>

            <div className="flex gap-8">
                <div className="flex-1 bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">HOW TO USE</h3>
                    <ul className="space-y-5">
                        <Step number="1" text="Upload one or more files." />
                        <Step number="2" text="Drag and drop thumbnails to reorder pages." />
                        <Step number="3" text="For splitting, define ranges like '1-5'." />
                        <Step number="4" text="Download the merged or split result immediately." />
                    </ul>
                </div>
                <div className="w-56 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center">
                    <h3 className="text-xs font-bold text-gray-300 uppercase mb-4">PREVIEW</h3>
                    <div className="w-10 h-14 border border-blue-300 rounded bg-white shadow flex items-center justify-center text-blue-300 text-xs">2</div>
                </div>
            </div>
        </div>

        {/* 4. Convert */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Convert & Create</h2>
            <div className="flex gap-2 mb-6">
                <Pill text="Word to PDF" />
                <Pill text="PDF to Word" />
                <Pill text="PDF to Excel" />
                <Pill text="Image to PDF" />
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">HOW TO USE</h3>
                <ul className="space-y-5">
                    <Step number="1" text="Choose your source format (Word, Image, PDF)." />
                    <Step number="2" text="Upload the file to the conversion tool." />
                    <Step number="3" text="The system converts the layout while preserving formatting." />
                    <Step number="4" text="Download the converted file (PDF, Word, Excel, etc.)." />
                </ul>
            </div>
        </div>
      </div>

      {/* --- PAGE 4 --- */}
      <div className="html2pdf__page-break"></div>
      <div className="relative h-[297mm] flex flex-col pt-12 space-y-16">
        
        {/* 5. AI Intelligence */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. AI Intelligence</h2>
            <div className="flex gap-2 mb-6">
                <Pill text="AI Summary" />
                <Pill text="PDF OCR" />
            </div>

            <div className="flex gap-8">
                <div className="flex-1 bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">HOW TO USE</h3>
                    <ul className="space-y-5">
                        <Step number="1" text="Upload your document." />
                        <Step number="2" text="The AI (Gemini 2.5 Flash) analyzes text and visual content." />
                        <Step number="3" text="View concise summaries or extract text from scans." />
                        <Step number="4" text="Copy results or download as text files." />
                    </ul>
                </div>
                <div className="w-56 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center">
                    <h3 className="text-xs font-bold text-gray-300 uppercase mb-4">PREVIEW</h3>
                    <div className="w-16 h-20 bg-gray-100 rounded border border-gray-300 p-2 flex flex-col gap-1">
                        <div className="h-1 bg-gray-400 w-full rounded"></div>
                        <div className="h-1 bg-gray-400 w-2/3 rounded"></div>
                        <div className="h-1 bg-green-400 w-full mt-2 rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* 6. Security & Repair */}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Security & Repair</h2>
            <div className="flex gap-2 mb-6">
                <Pill text="Unlock PDF" />
                <Pill text="Repair PDF" />
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">HOW TO USE</h3>
                <ul className="space-y-5">
                    <Step number="1" text="Upload the protected or damaged file." />
                    <Step number="2" text="For Unlock: Enter the password if known." />
                    <Step number="3" text="For Repair: We rebuild the file structure to recover data." />
                    <Step number="4" text="Download the clean, accessible file." />
                </ul>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
            <h3 className="text-gray-400 font-bold text-xs tracking-widest uppercase mb-2">PRIVACY GUARANTEE</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto">
                We use client-side processing (WebAssembly) for most tasks. Your files generally do not leave your browser. 
                For AI features, data is sent securely to Google Gemini only for the duration of the task.
            </p>
        </div>
      </div>
    </div>
  );
};

// Helpers
const Pill = ({ text }: { text: string }) => (
    <span className="px-4 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wide bg-white">
        {text}
    </span>
);

const Step = ({ number, text }: { number: string, text: string }) => (
    <li className="flex gap-4">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
            {number}
        </span>
        <p className="text-gray-600 text-sm leading-relaxed pt-0.5">{text}</p>
    </li>
);

const FeatureBox = ({ color, iconColor, title, sub }: { color: string, iconColor: string, title: string, sub: string }) => (
    <div className={`border border-gray-100 rounded-xl p-5 text-center flex flex-col items-center h-full bg-white`}>
        <div className={`w-12 h-12 rounded-2xl mb-4 ${iconColor}`}></div>
        <h4 className="font-bold text-gray-800 text-xs uppercase mb-2">{title}</h4>
        <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>
    </div>
);

export default UserGuideTemplate;
