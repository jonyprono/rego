import { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signature: string | null) => void;
  label?: string;
}

export default function SignaturePad({ onSave, label = "Signature du client" }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    onSave(null);
  };

  const handleEnd = () => {
    setIsEmpty(false);
    if (sigCanvas.current) {
      // Save as base64 png
      try {
        const dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');
        onSave(dataURL);
      } catch (e) {
        console.error("Erreur capture signature:", e);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'signature-canvas w-full h-48 cursor-crosshair bg-white rounded-lg',
            width: 800,
            height: 200
          }}
          onEnd={handleEnd}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
            Signez ici (souris, doigt ou stylet)
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clear}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Effacer la signature
        </button>
      </div>
    </div>
  );
}
