"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadImage } from "@/app/actions/upload"
import Image from "next/image"
import ImageCropModal from "@/components/image-crop-modal"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface ImageUploadGridProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export default function ImageUploadGrid({ images, onChange, maxImages = 6 }: ImageUploadGridProps) {
  const { t } = useLanguage()
  const [uploading, setUploading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingImage, setEditingImage] = useState<{ url: string; index: number } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(index)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadImage(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        const newImages = [...images]
        newImages[index] = result.url
        onChange(newImages)
      }
    } catch (err) {
      setError(t("imageUploadError"))
    } finally {
      setUploading(null)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages[index] = ""
    onChange(newImages.filter((img) => img !== ""))
  }

  const handleEditImage = (url: string, index: number) => {
    setEditingImage({ url, index })
  }

  const handleSaveCroppedImage = async (croppedImageUrl: string) => {
    if (!editingImage) return

    try {
      setUploading(editingImage.index)
      
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadImage(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        const newImages = [...images]
        newImages[editingImage.index] = result.url
        onChange(newImages)
      }
    } catch (err) {
      setError(t("imageUploadError"))
    } finally {
      URL.revokeObjectURL(croppedImageUrl)
      setUploading(null)
      setEditingImage(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div 
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
          data-testid="alert-image-upload-error"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: maxImages }).map((_, index) => {
          const imageUrl = images[index]
          const isUploading = uploading === index

          return (
            <div
              key={index}
              className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:border-gray-400 transition-colors"
            >
              {imageUrl ? (
                <>
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={`Producto ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditImage(imageUrl, index)}
                      data-testid={`button-edit-image-${index}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveImage(index)}
                      data-testid={`button-remove-image-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 text-center px-2">Subir imagen {index + 1}</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, index)}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-sm text-gray-500">{t("imageUploadHint", { maxImages })}</p>

      {editingImage && (
        <ImageCropModal
          imageUrl={editingImage.url}
          isOpen={true}
          onClose={() => setEditingImage(null)}
          onSave={handleSaveCroppedImage}
        />
      )}
    </div>
  )
}
