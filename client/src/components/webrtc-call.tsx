import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface WebRTCCallProps {
  conversationId: string;
  userId: string;
  targetUserId: string;
  ws: WebSocket | null;
  onCallEnd: () => void;
}

export function WebRTCCall({ conversationId, userId, targetUserId, ws, onCallEnd }: WebRTCCallProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isIncoming, setIsIncoming] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    if (!ws) return;

    const handleWebSocketMessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.type === "webrtc-offer") {
        setIsIncoming(true);
        await handleOffer(data.offer);
      } else if (data.type === "webrtc-answer") {
        await handleAnswer(data.answer);
      } else if (data.type === "webrtc-ice-candidate") {
        await handleIceCandidate(data.candidate);
      } else if (data.type === "call-end") {
        endCall();
      }
    };

    ws.addEventListener("message", handleWebSocketMessage);

    return () => {
      ws.removeEventListener("message", handleWebSocketMessage);
    };
  }, [ws]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate && ws) {
        ws.send(JSON.stringify({
          type: "webrtc-ice-candidate",
          candidate: event.candidate,
          targetUserId,
        }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async (withVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (ws) {
        ws.send(JSON.stringify({
          type: "webrtc-offer",
          offer,
          targetUserId,
        }));
        ws.send(JSON.stringify({
          type: "call-start",
          callerId: userId,
          withVideo,
        }));
      }

      setIsCallActive(true);
      setIsVideoEnabled(withVideo);
      toast({
        title: "Chamada iniciada",
        description: withVideo ? "Chamada de vídeo iniciada" : "Chamada de voz iniciada",
      });
    } catch (error) {
      console.error("Erro ao iniciar chamada:", error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar câmera/microfone",
        variant: "destructive",
      });
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (ws) {
        ws.send(JSON.stringify({
          type: "webrtc-answer",
          answer,
          targetUserId,
        }));
      }

      setIsCallActive(true);
    } catch (error) {
      console.error("Erro ao processar oferta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a chamada",
        variant: "destructive",
      });
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error("Erro ao processar resposta:", error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Erro ao adicionar candidato ICE:", error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (ws && isCallActive) {
      ws.send(JSON.stringify({
        type: "call-end",
        targetUserId,
      }));
    }

    setIsCallActive(false);
    setIsIncoming(false);
    localStreamRef.current = null;
    peerConnectionRef.current = null;
    onCallEnd();
  };

  if (!isCallActive && !isIncoming) {
    return (
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={() => startCall(false)}
          data-testid="button-voice-call"
        >
          <Phone className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => startCall(true)}
          data-testid="button-video-call"
        >
          <Video className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed inset-4 z-50 flex flex-col">
      <div className="flex-1 relative bg-black rounded-md overflow-hidden">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          data-testid="video-remote"
        />
        {isVideoEnabled && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-md border-2 border-white"
            data-testid="video-local"
          />
        )}
      </div>
      
      <div className="flex items-center justify-center gap-4 p-4">
        <Button
          size="icon"
          variant={isAudioEnabled ? "default" : "destructive"}
          onClick={toggleAudio}
          data-testid="button-toggle-audio"
        >
          {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
        
        {isVideoEnabled && (
          <Button
            size="icon"
            variant={isVideoEnabled ? "default" : "secondary"}
            onClick={toggleVideo}
            data-testid="button-toggle-video"
          >
            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
        )}
        
        <Button
          size="icon"
          variant="destructive"
          onClick={endCall}
          data-testid="button-end-call"
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
