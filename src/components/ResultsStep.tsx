import React, { useState } from 'react';
import { Download, ChevronLeft, Image as ImageIcon, CheckCircle, Share2, FileDown } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ResultsStepProps {
  images: GeneratedImage[];
  onRestart: () => void;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ images, onRestart }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(
    images.length > 0 ? images[0].imageUrl : null
  );

  const downloadImage = async (url: string, format: 'png' | 'jpg') => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VeraLooks-Headshot.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try right-clicking the image to save.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle className="text-green-500 h-8 w-8" />
            Your Professional Results
          </h2>
          <p className="text-gray-600 mt-2">Flux-powered headshots with cinematic Peter Hurley lighting.</p>
        </div>
        
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft size={20} />
          Create New Look
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Large Preview Section */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-100 overflow-hidden group">
            {selectedImage ? (
              <div className="relative aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Selected Headshot"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <ImageIcon className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-600" />
              Download Options
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => selectedImage && downloadImage(selectedImage, 'png')}
                disabled={!selectedImage}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
              >
                <FileDown size={22} />
                Download High-Res PNG
              </button>
              
              <button
                onClick={() => selectedImage && downloadImage(selectedImage, 'jpg')}
                disabled={!selectedImage}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={22} />
                Download Print-Ready JPG
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
              Standard commercial license included. Suitable for LinkedIn, website, and marketing materials.
            </p>
          </div>

          {/* Thumbnail Gallery */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">All Generations</h3>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === img.imageUrl ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <img src={img.imageUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsStep;

