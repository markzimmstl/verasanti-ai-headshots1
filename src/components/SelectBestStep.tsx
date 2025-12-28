import React, { useState, useRef, ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from './Button.tsx';
import { UploadedImage } from '../types.ts';

interface ReferenceSelection {
  main: UploadedImage;
  sideLeft?: UploadedImage;
  sideRight?: UploadedImage;
  fullBody?: UploadedImage;
}

interface SelectBestStepProps {
  images: UploadedImage[]; // first page passes [mainPhoto]
  onNext: (refs: ReferenceSelection) => void;
  onBack: () => void;
}

export const SelectBestStep: React.FC<SelectBestStepProps> = ({
  images,
  onNext,
  onBack,
}) => {
  const main = images[0] || null;

  const [sideLeft, setSideLeft] = useState<UploadedImage | undefined>(undefined);
  const [sideRight, setSideRight] = useState<UploadedImage | undefined>(undefined);
  const [fullBody, setFullBody] = useState<UploadedImage | undefined>(undefined);

  const sideLeftInputRef = useRef<HTMLInputElement | null>(null);
  const sideRightInputRef = useRef<HTMLInputElement | null>(null);
  const fullBodyInputRef = useRef<HTMLInputElement | null>(null);

  const handleExtraUpload = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (img?: UploadedImage) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const uploaded: UploadedImage = {
        id: `${Date.now()}-${file.name}`,
        fileName: file.name,
        base64,
        createdAt: Date.now(),
        mimeType: file.type,
      };
      setter(uploaded);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!main) {
      alert('No Main Photo found. Please go back and upload your Main Photo.');
      onBack();
      return;
    }

    const refs: ReferenceSelection = {
      main,
      sideLeft,
      sideRight,
      fullBody,
    };

    console.log('SelectBestStep: Selected refs:', refs);
    onNext(refs);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-3">
          Option to add additional Reference Photos
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          You’ll get strong results from your Main Photo alone. These extra photos are
          completely optional, but they can help the AI better understand your face
          from different angles and your overall body proportions.
        </p>
      </div>

      {/* 1. Main Photo (required, but already chosen) */}
      <div className="mb-10 border border-slate-800 rounded-2xl p-4 bg-slate-950/60">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">
              1. Main Photo (required)
            </h3>
            <p className="text-sm text-slate-300 mb-2">
              This is the single photo that looks most like you today. The AI will use this
              as your primary identity reference.
            </p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Use good lighting and face straight at the lens.</li>
              <li>• Make sure the camera is straight up and down.</li>
              <li>• A friendly, professional smile works well.</li>
              <li>• Avoid using heavy filters.</li>
            </ul>
          </div>

          <div className="flex flex-col items-center gap-2">
            {main ? (
              <>
                <div className="w-32 h-32 rounded-xl overflow-hidden border border-slate-700">
                  <img
                    src={main.base64}
                    alt="Main reference"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-slate-500 max-w-[10rem] text-center truncate">
                  {main.fileName}
                </p>
              </>
            ) : (
              <p className="text-xs text-red-400">
                No Main Photo available. Please go back and upload one.
              </p>
            )}

            <Button
              variant="outline"
              className="mt-1 border-slate-600 text-slate-200 hover:bg-slate-800/70"
              onClick={onBack}
            >
              Change Main Photo
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Optional extra reference photos */}
      <div className="mb-8 border border-slate-800 rounded-2xl p-4 bg-slate-950/60">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white mb-1">
            2. Optional: Extra reference photos
          </h3>
          <p className="text-sm text-slate-300">
            These are completely optional. Adding 1–3 more photos can improve accuracy for
            angled views and full‑body photos. Use recent photos that still look like you.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Side view */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col items-stretch">
            <h4 className="text-sm font-semibold text-slate-100 mb-1">
              Side view (optional)
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Show one side of your face with good lighting. Helps the AI understand your face shape
              for angled photos.
            </p>

            <div
              className="flex-1 border-2 border-dashed border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-900/60 transition-colors"
              onClick={() => sideLeftInputRef.current?.click()}
            >
              {sideLeft ? (
                <>
                  <div className="w-full h-28 rounded-md overflow-hidden border border-slate-700 mb-2">
                    <img
                      src={sideLeft.base64}
                      alt="Side view"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate w-full">
                    {sideLeft.fileName}
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 text-indigo-400 mb-2" />
                  <p className="text-xs text-slate-200">
                    Click to upload side view
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    JPG or PNG
                  </p>
                </>
              )}
            </div>
            {sideLeft && (
              <button
                type="button"
                className="mt-2 text-[11px] text-slate-400 hover:text-slate-200 underline self-start"
                onClick={() => setSideLeft(undefined)}
              >
                Remove side view
              </button>
            )}
            <input
              type="file"
              ref={sideLeftInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleExtraUpload(e, setSideLeft)}
            />
          </div>

          {/* Other side */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col items-stretch">
            <h4 className="text-sm font-semibold text-slate-100 mb-1">
              Other side (optional)
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              If you have a photo from the other side of your face, add it here for even
              better 3D understanding.
            </p>

            <div
              className="flex-1 border-2 border-dashed border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-900/60 transition-colors"
              onClick={() => sideRightInputRef.current?.click()}
            >
              {sideRight ? (
                <>
                  <div className="w-full h-28 rounded-md overflow-hidden border border-slate-700 mb-2">
                    <img
                      src={sideRight.base64}
                      alt="Other side view"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate w-full">
                    {sideRight.fileName}
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 text-indigo-400 mb-2" />
                  <p className="text-xs text-slate-200">
                    Click to upload other side
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    JPG or PNG
                  </p>
                </>
              )}
            </div>
            {sideRight && (
              <button
                type="button"
                className="mt-2 text-[11px] text-slate-400 hover:text-slate-200 underline self-start"
                onClick={() => setSideRight(undefined)}
              >
                Remove other side
              </button>
            )}
            <input
              type="file"
              ref={sideRightInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleExtraUpload(e, setSideRight)}
            />
          </div>

          {/* Full body */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col items-stretch">
            <h4 className="text-sm font-semibold text-slate-100 mb-1">
              Full‑body photo (optional)
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Stand back so your whole body is visible, head to toe. Keep your phone/camera
              straight and upright to avoid distortion. Use your normal standing posture.
            </p>

            <div
              className="flex-1 border-2 border-dashed border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-900/60 transition-colors"
              onClick={() => fullBodyInputRef.current?.click()}
            >
              {fullBody ? (
                <>
                  <div className="w-full h-28 rounded-md overflow-hidden border border-slate-700 mb-2">
                    <img
                      src={fullBody.base64}
                      alt="Full body"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate w-full">
                    {fullBody.fileName}
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 text-indigo-400 mb-2" />
                  <p className="text-xs text-slate-200">
                    Click to upload full‑body photo
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    JPG or PNG
                  </p>
                </>
              )}
            </div>
            {fullBody && (
              <button
                type="button"
                className="mt-2 text-[11px] text-slate-400 hover:text-slate-200 underline self-start"
                onClick={() => setFullBody(undefined)}
              >
                Remove full‑body photo
              </button>
            )}
            <input
              type="file"
              ref={fullBodyInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleExtraUpload(e, setFullBody)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-800">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!main}>
          Continue
        </Button>
      </div>
    </div>
  );
};
