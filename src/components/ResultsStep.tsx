import React, { useState } from 'react';
import {
  Download, ChevronLeft, Image as ImageIcon, CheckCircle, FileDown,
  Wand2, X, Loader2, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { GeneratedImage } from '../types';
import { refineGeneratedImage } from '../services/geminiService';

interface ResultsStepProps {
  images: GeneratedImage[];
  onRestart: () => void;
}

// ─── Structured Edit Presets ─────────────────────────────────────────────────
// Each preset has a user-facing label and a proven, specific prompt that
// actually works with Gemini's image editing behavior.
// "mode" controls which button fires:
//   'edit'        → standard refineGeneratedImage (surface/texture/color fixes)
//   'regenerate'  → caller should re-run full generation (body structure changes)

interface EditPreset {
  label: string;
  prompt: string;
  mode: 'edit' | 'regenerate';
}

const EDIT_CATEGORIES: { category: string; presets: EditPreset[] }[] = [
  {
    category: 'Body & Build',
    presets: [
      {
        label: 'Slimmer build',
        prompt: 'Slim the shoulders, reduce upper arm width, narrow the chest, softer torso silhouette — lean and toned but not muscular.',
        mode: 'regenerate',
      },
      {
        label: 'Fuller build',
        prompt: 'Fuller figure, broader shoulders, softer midsection, more substantial body frame.',
        mode: 'regenerate',
      },
      {
        label: 'Less muscular',
        prompt: 'Reduce visible muscle definition significantly. Slim the upper arms, narrow the shoulders, soften the chest. The subject should look like an average professional, not an athlete.',
        mode: 'regenerate',
      },
      {
        label: 'Fix cut-off body parts',
        prompt: 'Extend the image to show the complete subject — ensure feet are fully visible with floor below them, head is fully visible with air above, and no fingers or limbs are cropped.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Face & Expression',
    presets: [
      {
        label: 'More natural smile',
        prompt: 'Adjust the facial expression to a warm, natural, relaxed smile — genuine and approachable, not forced or overly posed.',
        mode: 'edit',
      },
      {
        label: 'More confident look',
        prompt: 'Adjust the expression to look more confident and authoritative — direct eye contact, slight jaw set, composed and powerful.',
        mode: 'edit',
      },
      {
        label: 'Remove glasses',
        prompt: 'Remove the glasses from the subject\'s face entirely. Replace with natural skin and eyebrows matching the existing face.',
        mode: 'edit',
      },
      {
        label: 'Natural skin texture',
        prompt: 'Remove all beauty filter effects. Restore natural skin texture with visible pores, subtle lines, and realistic skin variation. The skin should look like a high-resolution photograph, not digitally smoothed.',
        mode: 'edit',
      },
      {
        label: 'Brighter, more flattering light on face',
        prompt: 'Increase the brightness and lift on the face only. Open up the shadows under the eyes and chin. Keep the background unchanged.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Background & Scene',
    presets: [
      {
        label: 'Zoom out — show more scene',
        prompt: 'Zoom out significantly to reveal more of the surrounding environment. Keep the subject centered but smaller in the frame with more background visible on all sides.',
        mode: 'edit',
      },
      {
        label: 'Blur background more',
        prompt: 'Apply a stronger, more pronounced lens blur (shallow depth of field / bokeh effect) to the background. The subject must remain in sharp focus. The background should be significantly more out of focus than it currently is.',
        mode: 'edit',
      },
      {
        label: 'Remove distracting objects',
        prompt: 'Remove any distracting background objects, poles, signs, or clutter from behind the subject. Replace with clean, neutral background material that matches the existing scene.',
        mode: 'edit',
      },
      {
        label: 'Remove screen / monitor from background',
        prompt: 'Remove any television screens, computer monitors, projector screens, whiteboards, or smartboards from the background walls. Replace with continuous architectural wall material — wood paneling, textured stone, or art — that matches the existing scene.',
        mode: 'edit',
      },
      {
        label: 'Brighter, more airy scene',
        prompt: 'Increase overall brightness and lift the shadows throughout the entire image. Make the scene feel more airy, open, and optimistic without overexposing the subject.',
        mode: 'edit',
      },
      {
        label: 'Moodier, darker atmosphere',
        prompt: 'Reduce overall brightness. Deepen shadows and increase contrast throughout the scene. Make the atmosphere feel more dramatic, serious, and cinematic.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Clothing & Color',
    presets: [
      {
        label: 'Make clothing more professional',
        prompt: 'Replace the current clothing with a more polished, professional option appropriate for a corporate headshot — a well-tailored blazer or suit jacket in a neutral color.',
        mode: 'edit',
      },
      {
        label: 'Remove tie',
        prompt: 'Remove the necktie from the subject. Replace with a clean, open-collar shirt look that matches the existing shirt style and color.',
        mode: 'edit',
      },
      {
        label: 'Fix clothing color',
        prompt: 'Adjust the clothing color to be a more neutral, professional tone — navy, charcoal, or dark grey. Keep the clothing style and cut identical.',
        mode: 'edit',
      },
    ],
  },
  {
    category: 'Overall Quality',
    presets: [
      {
        label: 'Sharpen overall detail',
        prompt: 'Increase overall image sharpness and micro-contrast. Enhance fine detail in the face, clothing, and background. The result should look like a higher-resolution, crisper photograph.',
        mode: 'edit',
      },
      {
        label: 'Fix unnatural AI artifacts',
        prompt: 'Fix any unnatural AI artifacts — incorrect finger counts, asymmetrical facial features, distorted clothing seams, or unrealistic skin patterns. Make the image look like a real photograph.',
        mode: 'edit',
      },
    ],
  },
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
  const [selectedPreset, setSelectedPreset] = useState<EditPreset | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Body & Build');

  const downloadImage = async (url: string, format: 'webp' | 'png') => {
    try {
      const response = await fetch(url);
      const sourceBlob = await response.blob();
      const bitmap = await createImageBitmap(sourceBlob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);

      const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
      const quality = format === 'webp' ? 0.85 : undefined;

      const finalBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Canvas conversion failed')),
          mimeType,
          quality
        );
      });

      const filename = `VeraLooks-Headshot.${format}`;

      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: format === 'webp' ? 'WebP Image' : 'PNG Image', accept: { [mimeType]: [`.${format}`] } }],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(finalBlob);
          await writable.close();
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
        }
      }

      const blobUrl = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try right-clicking the image to save.');
    }
  };

  const handleSelectPreset = (preset: EditPreset) => {
    setSelectedPreset(preset);
    setEditPrompt(preset.prompt);
  };

  const handleApplyEdit = async (mode: 'edit' | 'regenerate') => {
    if (!selectedImage || !editPrompt.trim()) return;

    setIsRefining(true);
    setEditError(null);

    try {
      const aspectRatio = (selectedImage.aspectRatio || '1:1') as any;

      let refinedUrl: string;

      if (mode === 'regenerate') {
        // For body/structure changes: re-run generation with the edit prompt
        // injected as an additional instruction on top of the original
        refinedUrl = await refineGeneratedImage(
          selectedImage.imageUrl,
          `BODY STRUCTURE CHANGE — treat this as a full re-render, not a surface edit. ${editPrompt}. Preserve the subject's face, clothing style, scene, and lighting exactly. Only change the body proportions as described.`,
          aspectRatio
        );
      } else {
        refinedUrl = await refineGeneratedImage(
          selectedImage.imageUrl,
          editPrompt,
          aspectRatio
        );
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString() + Math.random().toString(),
        originalUrl: refinedUrl,
        imageUrl: refinedUrl,
        styleName: `${selectedImage.styleName} (Edited)`,
        styleId: selectedImage.styleId,
        createdAt: Date.now(),
        aspectRatio: selectedImage.aspectRatio,
      };

      setDisplayImages(prev => {
        const idx = prev.findIndex(img => img.id === selectedImage.id);
        if (idx === -1) return [...prev, newImage];
        const updated = [...prev];
        updated.splice(idx + 1, 0, newImage);
        return updated;
      });

      setSelectedImage(newImage);
      setEditPrompt('');
      setSelectedPreset(null);
      setIsEditPanelOpen(false);

    } catch (err: any) {
      console.error('Edit failed:', err);
      setEditError(
        'This edit didn\'t take. For body structure changes, try "Regenerate with changes" instead — it\'s more reliable for those. For everything else, try rephrasing your instruction with more specific anatomical detail.'
      );
    } finally {
      setIsRefining(false);
    }
  };

  const activeMode = selectedPreset?.mode ?? 'edit';
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
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-5">

                  {/* Panel header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Wand2 size={16} className="text-indigo-600" />
                      Edit Image
                    </h3>
                    <button
                      onClick={() => { setIsEditPanelOpen(false); setEditError(null); setEditPrompt(''); setSelectedPreset(null); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* How-it-works note */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">How edits work:</span> Surface edits (lighting, background, clothing color) work well directly. Body structure changes (muscle, weight, proportions) use a deeper regeneration pass — use the <span className="font-semibold text-indigo-600">Regenerate with changes</span> button for those. Each edit uses 1 credit.
                  </div>

                  {/* Categorized presets */}
                  <div className="space-y-2">
                    {EDIT_CATEGORIES.map((cat) => (
                      <div key={cat.category} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{cat.category}</span>
                          {expandedCategory === cat.category
                            ? <ChevronUp size={14} className="text-gray-400" />
                            : <ChevronDown size={14} className="text-gray-400" />}
                        </button>
                        {expandedCategory === cat.category && (
                          <div className="px-4 pb-3 pt-2 flex flex-wrap gap-2">
                            {cat.presets.map((preset) => (
                              <button
                                key={preset.label}
                                onClick={() => handleSelectPreset(preset)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                                  selectedPreset?.label === preset.label
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600'
                                }`}
                              >
                                {preset.mode === 'regenerate' && (
                                  <RefreshCw size={10} className={selectedPreset?.label === preset.label ? 'text-white' : 'text-indigo-400'} />
                                )}
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Selected preset indicator */}
                  {selectedPreset && (
                    <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed border ${
                      selectedPreset.mode === 'regenerate'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                        : 'bg-green-50 border-green-200 text-green-800'
                    }`}>
                      {selectedPreset.mode === 'regenerate' ? (
                        <><span className="font-semibold">⚡ Deep regeneration preset selected.</span> This change affects body structure — use "Regenerate with changes" below for best results.</>
                      ) : (
                        <><span className="font-semibold">✓ Surface edit preset selected.</span> Use "Apply Edit" below.</>
                      )}
                    </div>
                  )}

                  {/* Custom prompt textarea */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Custom instruction (or edit the preset above)
                    </label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => { setEditPrompt(e.target.value); setSelectedPreset(null); }}
                      placeholder="Describe your edit in specific anatomical or visual terms (e.g. 'Slim the upper arms and narrow the shoulders, keep everything else identical')..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                    />
                  </div>

                  {editError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                      {editError}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {/* Standard edit — best for surface changes */}
                    <button
                      onClick={() => handleApplyEdit('edit')}
                      disabled={!editPrompt.trim() || isRefining}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      {isRefining ? (
                        <><Loader2 size={15} className="animate-spin" />Working...</>
                      ) : (
                        <><Wand2 size={15} />Apply Edit</>
                      )}
                    </button>

                    {/* Regeneration — best for body/structure changes */}
                    <button
                      onClick={() => handleApplyEdit('regenerate')}
                      disabled={!editPrompt.trim() || isRefining}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      {isRefining ? (
                        <><Loader2 size={15} className="animate-spin" />Working...</>
                      ) : (
                        <><RefreshCw size={15} />Regenerate with changes</>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400 text-center">
                    Not sure which to use? Use <strong>Apply Edit</strong> for background, lighting, and clothing changes. Use <strong>Regenerate</strong> for body shape, muscle, or weight changes.
                  </p>

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
                Download Hi-Res File
              </button>
              <button
                onClick={() => selectedImage && downloadImage(selectedImage.imageUrl, 'webp')}
                disabled={!selectedImage}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={22} />
                Download Web-Ready Image
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
