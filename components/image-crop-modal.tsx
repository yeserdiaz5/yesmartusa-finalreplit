"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { Loader2 } from "lucide-react"

interface ImageCropModalProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
  onSave: (croppedImageUrl: string) => Promise<void>
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface Point {
  x: number
  y: number
}

export default function ImageCropModal({ imageUrl, isOpen, onClose, onSave }: ImageCropModalProps) {
  const { t } = useLanguage()
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onCropComplete = useCallback((_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createCroppedImage = async (): Promise<string> => {
    if (!croppedAreaPixels) {
      throw new Error("No crop area selected")
    }

    return new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = "anonymous"
      image.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        canvas.width = croppedAreaPixels.width
        canvas.height = croppedAreaPixels.height

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        )

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"))
            return
          }
          const url = URL.createObjectURL(blob)
          resolve(url)
        }, "image/jpeg", 0.95)
      }
      image.onerror = () => reject(new Error("Failed to load image"))
      image.src = imageUrl
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const croppedImageUrl = await createCroppedImage()
      await onSave(croppedImageUrl)
      onClose()
    } catch (error) {
      console.error("Error cropping image:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" data-testid="dialog-image-crop">
        <DialogHeader>
          <DialogTitle>{t("editImage")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition={false}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("zoom")}</label>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={0.5}
              max={3}
              step={0.1}
              data-testid="slider-zoom"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            data-testid="button-cancel-crop"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="button-save-crop"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
