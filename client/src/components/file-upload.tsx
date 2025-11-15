import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Image, Paperclip, Upload, X } from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  type: 'image' | 'file';
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

export function FileUpload({ type, open, onClose, onUpload }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const accept = type === 'image' 
    ? 'image/jpeg,image/png,image/gif,image/webp'
    : '.pdf,.doc,.docx,.xls,.xlsx,.txt';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'image' ? <Image className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
            {type === 'image' ? 'Enviar Imagem' : 'Enviar Arquivo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />

          {preview && type === 'image' ? (
            <div className="relative aspect-video bg-black rounded-md overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            </div>
          ) : selectedFile ? (
            <div className="p-4 border rounded-md">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <label
              htmlFor="file-input"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Clique para selecionar um arquivo
              </p>
              <p className="text-xs text-muted-foreground">
                {type === 'image' ? 'JPG, PNG, GIF, WEBP' : 'PDF, DOC, DOCX, XLS, XLSX, TXT'}
              </p>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile}>
            <Upload className="w-4 h-4 mr-2" />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
