import { useRef, useState, useEffect } from "react"
import { Camera, X, Search, FlipHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const { toast } = useToast()

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
      }
      setIsLoading(false)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara.")
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9)
    
    stopCamera()
    onCapture(imageDataUrl)
  }

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full w-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-camera"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center gap-2 text-white">
            <Camera className="h-5 w-5" />
            <span className="font-semibold text-lg">lens ai</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCamera}
            className="text-white hover:bg-white/20"
            data-testid="button-flip-camera"
          >
            <FlipHorizontal className="h-6 w-6" />
          </Button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                <p>Iniciando cámara...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-white text-center px-6">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Error de cámara</p>
                <p className="text-sm opacity-75">{error}</p>
                <Button
                  onClick={startCamera}
                  className="mt-4"
                  data-testid="button-retry-camera"
                >
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            data-testid="video-camera-preview"
          />

          {/* Scanning Frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-72">
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
          </div>

          {/* Instruction Text */}
          <div className="absolute top-32 left-0 right-0 text-center">
            <p className="text-white text-lg font-medium drop-shadow-lg">
              Toma una foto para buscar productos
            </p>
          </div>
        </div>

        {/* Capture Button */}
        <div className="absolute bottom-0 left-0 right-0 pb-10 pt-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-center">
            <Button
              onClick={capturePhoto}
              disabled={isLoading || !!error}
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 flex flex-col items-center justify-center gap-1 shadow-lg"
              data-testid="button-capture-photo"
            >
              <Search className="h-7 w-7 text-black" />
              <span className="text-black text-xs font-semibold">Buscar</span>
            </Button>
          </div>

          {/* Bottom Navigation Hint */}
          <div className="flex items-center justify-center gap-8 mt-6 text-white text-sm">
            <div className="flex flex-col items-center gap-1 opacity-50">
              <Camera className="h-5 w-5" />
              <span>Buscar</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-30">
              <div className="h-5 w-5" />
              <span>Cargar</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-30">
              <div className="h-5 w-5" />
              <span>Código de barras</span>
            </div>
          </div>
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
