import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import Button from './Button';

interface QrGeneratorProps {
  onGenerate?: (dataUrl: string) => void;
  showDownload?: boolean;
}

type QrType = 'url' | 'text' | 'contact' | 'sms' | 'email' | 'phone' | 'wifi';

const Icons = {
  Url: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
  Text: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Contact: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>,
  Sms: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 01-2-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>,
  Email: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  Phone: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
  Wifi: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>,
};

const QrGenerator: React.FC<QrGeneratorProps> = ({ onGenerate, showDownload = true }) => {
  const [activeTab, setActiveTab] = useState<QrType>('url');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Fields
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [contact, setContact] = useState({ name: '', phone: '', email: '', org: '', title: '' });
  const [sms, setSms] = useState({ phone: '', message: '' });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [phone, setPhone] = useState('');
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' });

  // Styles
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  
  const generate = useCallback(async () => {
    let data = '';
    
    switch (activeTab) {
        case 'url':
            if (!url) return;
            data = url;
            break;
        case 'text':
            if (!text) return;
            data = text;
            break;
        case 'contact':
            if (!contact.name) return;
            data = `BEGIN:VCARD\nVERSION:3.0\nN:${contact.name}\nTEL:${contact.phone}\nEMAIL:${contact.email}\nORG:${contact.org}\nTITLE:${contact.title}\nEND:VCARD`;
            break;
        case 'sms':
            if (!sms.phone) return;
            data = `SMSTO:${sms.phone}:${sms.message}`;
            break;
        case 'email':
            if (!email.to) return;
            data = `mailto:${email.to}?subject=${email.subject}&body=${email.body}`;
            break;
        case 'phone':
            if (!phone) return;
            data = `tel:${phone}`;
            break;
        case 'wifi':
            if (!wifi.ssid) return;
            data = `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};;`;
            break;
    }

    try {
        if (!data) return;
        const generatedUrl = await QRCode.toDataURL(data, {
            width: 400,
            margin: 1,
            color: {
                dark: fgColor,
                light: bgColor
            }
        });
        setQrDataUrl(generatedUrl);
        if (onGenerate) onGenerate(generatedUrl);
    } catch (err) {
        // console.error("QR Generation Error:", err);
    }
  }, [activeTab, url, text, contact, sms, email, phone, wifi, fgColor, bgColor, onGenerate]);

  useEffect(() => {
      const timer = setTimeout(() => {
          generate();
      }, 300);
      return () => clearTimeout(timer);
  }, [generate]);

  const downloadQr = () => {
      if (!qrDataUrl) return;
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const TabButton = ({ type, label, icon: IconComp }: { type: QrType, label: string, icon: React.FC<any> }) => (
      <button 
        onClick={() => setActiveTab(type)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg w-full md:w-auto mb-1 ${activeTab === type ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
      >
          <IconComp />
          <span>{label}</span>
      </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* Left Sidebar - Tabs */}
        <div className="w-full md:w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto shrink-0 p-2">
            <div className="space-y-1">
                <TabButton type="url" label="URL" icon={Icons.Url} />
                <TabButton type="text" label="Text" icon={Icons.Text} />
                <TabButton type="contact" label="Contact" icon={Icons.Contact} />
                <TabButton type="wifi" label="Wi-Fi" icon={Icons.Wifi} />
                <TabButton type="sms" label="SMS" icon={Icons.Sms} />
                <TabButton type="email" label="Email" icon={Icons.Email} />
                <TabButton type="phone" label="Phone" icon={Icons.Phone} />
            </div>
        </div>

        {/* Middle - Inputs */}
        <div className="flex-1 bg-white p-6 overflow-y-auto">
            <div className="max-w-md mx-auto">
                <div className="space-y-4">
                    {activeTab === 'url' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Website URL</label>
                            <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://example.com" />
                        </div>
                    )}
                    {activeTab === 'text' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Text Content</label>
                            <textarea value={text} onChange={e => setText(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="Enter your text here..." />
                        </div>
                    )}
                    {activeTab === 'contact' && (
                        <>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Name</label><input type="text" value={contact.name} onChange={e => setContact({...contact, name: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="John Doe" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label><input type="tel" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="+1 234 567 890" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label><input type="email" value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="john@example.com" /></div>
                        </>
                    )}
                    {activeTab === 'wifi' && (
                        <>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">SSID</label><input type="text" value={wifi.ssid} onChange={e => setWifi({...wifi, ssid: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label><input type="text" value={wifi.password} onChange={e => setWifi({...wifi, password: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm" /></div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Encryption</label>
                                <select value={wifi.encryption} onChange={e => setWifi({...wifi, encryption: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                                    <option value="WPA">WPA/WPA2</option>
                                    <option value="WEP">WEP</option>
                                    <option value="nopass">None</option>
                                </select>
                            </div>
                        </>
                    )}
                    {activeTab === 'sms' && (
                        <>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label><input type="tel" value={sms.phone} onChange={e => setSms({...sms, phone: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message</label><textarea value={sms.message} onChange={e => setSms({...sms, message: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm h-20" /></div>
                        </>
                    )}
                    {activeTab === 'email' && (
                        <>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email To</label><input type="email" value={email.to} onChange={e => setEmail({...email, to: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label><input type="text" value={email.subject} onChange={e => setEmail({...email, subject: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Body</label><textarea value={email.body} onChange={e => setEmail({...email, body: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 text-sm h-20" /></div>
                        </>
                    )}
                    {activeTab === 'phone' && (
                        <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="+1 234 567 890" /></div>
                    )}

                    <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="h-8 w-12 rounded border cursor-pointer" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Background</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 w-12 rounded border cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right - Preview */}
        {showDownload && (
            <div className="w-full md:w-64 bg-gray-50 border-l border-gray-200 flex flex-col items-center justify-center p-6 shrink-0">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4">
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 object-contain" />
                    ) : (
                        <div className="w-40 h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                            Type to generate
                        </div>
                    )}
                </div>
                
                <Button onClick={downloadQr} disabled={!qrDataUrl} className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2">
                    Download PNG
                </Button>
            </div>
        )}
    </div>
  );
};

export default QrGenerator;