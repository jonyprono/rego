import { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';

interface PhotoUploaderProps {
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
}

export default function PhotoUploader({ onPhotosChange, maxPhotos = 5 }: PhotoUploaderProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const combinedFiles = [...files, ...newFiles].slice(0, maxPhotos);
      
      setFiles(combinedFiles);
      onPhotosChange(combinedFiles);
      
      // Generate previews
      const newUrls = combinedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(newUrls);
      
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    
    setFiles(newFiles);
    onPhotosChange(newFiles);
    
    const newUrls = [...previewUrls];
    URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setPreviewUrls(newUrls);
  };

  return (
    <div className="space-y-4">
      <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer block w-full">
        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
          <div className="p-3 bg-gray-100 rounded-full">
            <Camera size={32} className="text-gray-600" />
          </div>
          <p className="font-medium">Cliquez pour ajouter des photos</p>
          <p className="text-xs text-gray-400">Tous les formats d'images sont acceptés (Max {maxPhotos})</p>
        </div>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
      </label>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
              <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
