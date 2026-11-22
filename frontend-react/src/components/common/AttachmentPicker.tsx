import React, { useRef } from 'react';
import { Paperclip, X, AlertCircle } from 'lucide-react';

interface AttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  files,
  onChange,
  maxFiles = 5,
  maxSizeBytes = 15 * 1024 * 1024, // 15MB
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setError(null);
    const selected = Array.from(e.target.files);

    if (files.length + selected.length > maxFiles) {
      setError(`You can attach a maximum of ${maxFiles} files.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of selected) {
      if (file.size > maxSizeBytes) {
        setError(`"${file.name}" exceeds the 15 MB size limit.`);
        return;
      }
      validFiles.push(file);
    }

    onChange([...files, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setError(null);
    const updated = [...files];
    updated.splice(index, 1);
    onChange(updated);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || files.length >= maxFiles}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= maxFiles}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-light-300 hover:bg-light-400 text-navy border border-slate-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
          <span>Attach files</span>
          <span className="text-slate-400 font-normal">({files.length}/{maxFiles})</span>
        </button>
        <span className="text-[11px] text-slate-400">Up to 5 files (max 15MB each)</span>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-deepRed">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs bg-light border border-slate-200 text-navy shadow-2xs"
            >
              <Paperclip className="w-3 h-3 text-slate-400" />
              <span className="font-medium truncate max-w-[160px]">{file.name}</span>
              <span className="text-[10px] text-slate-400">({formatSize(file.size)})</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                disabled={disabled}
                className="text-slate-400 hover:text-deepRed transition p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
