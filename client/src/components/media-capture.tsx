import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mic, Video, Camera, X, Check, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaCaptureProps {
  type: 'audio' | 'video' | 'photo';
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function MediaCapture({ type, open, onClose, onCapture }: MediaCaptureProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCapture = async () => {
    try {
      const constraints = type === 'audio' 
        ? { audio: true }
        : { video: true, audio: type === 'video' };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (type !== 'audio' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      if (type !== 'photo') {
        const mimeType = type === 'audio' ? 'audio/webm' : 'video/webm';
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setMediaUrl(url);
          chunksRef.current = [];
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Erro ao acessar mídia:', error);
      toast({
        title: "Erro ao acessar mídia",
        description: "Verifique as permissões do navegador",
        variant: "destructive",
      });
    }
  };

  const stopCapture = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setMediaUrl(url);
            stopCapture();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleSave = async () => {
    if (!mediaUrl) return;

    const response = await fetch(mediaUrl);
    const blob = await response.blob();
    
    const extension = type === 'audio' ? 'webm' : type === 'video' ? 'webm' : 'jpg';
    const fileName = `${type}-${Date.now()}.${extension}`;
    const file = new File([blob], fileName, { type: blob.type });
    
    onCapture(file);
    handleClose();
  };

  const handleClose = () => {
    stopCapture();
    setMediaUrl(null);
    setIsRecording(false);
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'audio': return <Mic className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'photo': return <Camera className="w-6 h-6" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'audio': return 'Gravar Áudio';
      case 'video': return 'Gravar Vídeo';
      case 'photo': return 'Tirar Foto';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {type !== 'audio' && (
            <div className="relative aspect-video bg-black rounded-md overflow-hidden">
              {mediaUrl ? (
                type === 'photo' ? (
                  <img src={mediaUrl} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                  <video src={mediaUrl} controls className="w-full h-full" />
                )
              ) : (
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              )}
            </div>
          )}

          {type === 'audio' && mediaUrl && (
            <audio src={mediaUrl} controls className="w-full" />
          )}

          {type === 'audio' && isRecording && (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm">Gravando...</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!mediaUrl ? (
            <>
              {!isRecording ? (
                <Button onClick={type === 'photo' ? () => startCapture().then(capturePhoto) : startCapture} className="flex-1">
                  {type === 'photo' ? <Camera className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {type === 'photo' ? 'Capturar' : 'Iniciar'}
                </Button>
              ) : (
                <Button onClick={type === 'photo' ? capturePhoto : stopCapture} variant="destructive" className="flex-1">
                  <Square className="w-4 h-4 mr-2" />
                  {type === 'photo' ? 'Tirar Foto' : 'Parar'}
                </Button>
              )}
              <Button onClick={handleClose} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => { setMediaUrl(null); startCapture(); }} variant="outline" className="flex-1">
                Refazer
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
