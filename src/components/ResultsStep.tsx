import React, { useState } from 'react';
import { Download, ChevronLeft, Image as ImageIcon, CheckCircle, FileDown, Wand2, X, Loader2 } from 'lucide-react';
import { GeneratedImage } from '../types';
import { refineGeneratedImage } from '../services/geminiService';

interface ResultsStepProps {
  images: GeneratedImage[];
  onRestart: () => void;
}

const SUGGESTED_EDITS = [
  "Zoom out to show more of the scene",
  "Make the background more blurred (shallower depth of field)",
  "Improve skin texture — less airbrushed, more natural",
  "Brighten the face with more flattering light",
  "Fix any cropped or cut-off body parts",
  "Remove glasses",
  "Make the expression more natural and confident",
  "Adjust clothing color to be more professional",
  "Add more environmental depth to the background",
  "Sharpen overall image clarity and detail",
];

const getAspectClass = (ratio?: string): string => {
  switch (ratio) {
    case '16:9': return 'aspect-video';
    case '9:16': return 'aspect-[9/16]';
    case '4:5':  return 'aspect-[4/5]';
    case '3:1':  return 'aspect-[3/1]';
    case '4:1':  return 'aspect-[4/1]';
    case '1:1':
    default:     return 'aspect-square';
  }
};

const ResultsStep: React.FC<ResultsStepProps> = ({ images, onRestart }) => {
  const [displayImages, setDisplayImages] = useState<GeneratedImage[]>(images);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    images.length > 0 ? images[0] : null
  );

  // Edit state
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  const handleEditPreset = (preset: string) => {
    setEditPrompt(preset);
  };

  const handleApplyEdit = async () => {
    if (!selectedImage || !editPrompt.trim()) return;

    setIsRefining(true);
    setEditError(null);

    try {
      const aspectRatio = (selectedImage.aspectRatio || '1:1') as any;
      const refinedUrl = await refineGeneratedImage(
        selectedImage.imageUrl,
        editPrompt,
        aspectRatio
      );

      const newImage: GeneratedImage = {
        id: Date.now().toString() + Math.random().toString(),
        originalUrl: refinedUrl,
        imageUrl: refinedUrl,
        styleName: `${selectedImage.styleName} (Edited)`,
        styleId: selectedImage.styleId,
        createdAt: Date.now(),
        aspectRatio: selectedImage.aspectRatio,
      };

      // Insert edited image right after the original in the list
      setDisplayImages(prev => {
        const idx = prev.findIndex(img => img.id === selectedImage.id);
        if (idx === -1) return [...prev, newImage];
        const updated = [...prev];
        updated.splice(idx + 1, 0, newImage);
        return updated;
      });

      setSelectedImage(newImage);
      setEditPrompt('');
      setIsEditPanelOpen(false);
    } catch (err: any) {
      console.error('Edit failed:', err);
      setEditError(
        'Sometimes edits don\'t take. You can try again here or click "Create a New Look" and use "Add Your Own Outfit" or "Add Your Own Background" to get better results.'
      );
    } finally {
      setIsRefining(false);
    }
  };

  const aspectClass = getAspectClass(selectedImage?.aspectRatio);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle className="text-green-500 h-8 w-8" />
            Your Professional Results
          </h2>
          <p className="text-gray-600 mt-2">
            {displayImages.length} image{displayImages.length !== 1 ? 's' : ''} generated. Select one to download or edit.
          </p>
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
        {/* Large Preview */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-gray-100 overflow-hidden group">
            {selectedImage ? (
              <div className={`relative ${aspectClass} bg-gray-50 rounded-2xl overflow-hidden`}>
                <img
                  src={selectedImage.imageUrl}
                  alt="Selected Headshot"
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <ImageIcon className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Edit Panel */}
          {selectedImage && (
            <div className="mt-4">
              {!isEditPanelOpen ? (
                <button
                  onClick={() => setIsEditPanelOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Wand2 size={18} />
                  Edit This Image
                </button>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Wand2 size={16} className="text-indigo-600" />
                      Edit Image
                    </h3>
                    <button
                      onClick={() => { setIsEditPanelOpen(false); setEditError(null); setEditPrompt(''); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500">
                    Choose a preset or write your own instruction. Each edit uses 1 credit and adds the result next to the original.
                  </p>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_EDITS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleEditPreset(preset)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          editPrompt === preset
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom prompt */}
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Or describe your own edit (e.g. 'Make the background a warm sunset outside a city skyline')..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />

                  {editError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                      {editError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleApplyEdit}
                      disabled={!editPrompt.trim() || isRefining}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRefining ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Applying Edit...
                        </>
                      ) : (
                        <>
                          <Wand2 size={16} />
                          Apply Edit (1 credit)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Download */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-600" />
              Download Options
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => selectedImage && downloadImage(selectedImage.imageUrl, 'png')}
                disabled={!selectedImage}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
              >
                <FileDown size={22} />
                Download High-Res PNG
              </button>
              <button
                onClick={() => selectedImage && downloadImage(selectedImage.imageUrl, 'jpg')}
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              All Generations ({displayImages.length})
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {displayImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage?.id === img.id
                      ? 'border-indigo-600 ring-2 ring-indigo-100'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {img.styleName?.includes('(Edited)') && (
                    <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 text-white text-[9px] text-center py-0.5 font-semibold tracking-wide">
                      EDITED
                    </div>
                  )}
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
