"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { createProduct, updateProduct, type CreateProductInput } from "@/app/actions/products"
import type { Category, Tag, Product } from "@/lib/types/database"
import { ArrowLeft, Loader2 } from "lucide-react"
import ImageUploadGrid from "@/components/image-upload-grid"

interface ProductFormProps {
  categories: Category[]
  tags: Tag[]
  product?: Product
  productCategories?: string[]
  productTags?: string[]
}

export default function ProductForm({
  categories,
  tags,
  product,
  productCategories = [],
  productTags = [],
}: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log("[v0] Product data:", product)
  console.log("[v0] Product images:", product?.images)
  console.log("[v0] Product image_url:", product?.image_url)

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    stock_quantity: product?.stock_quantity?.toString() || "",
    images:
      product?.images && product.images.length > 0 ? product.images : product?.image_url ? [product.image_url] : [],
    category_ids: productCategories,
    tag_ids: productTags,
  })

  console.log("[v0] Form data images:", formData.images)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!product && formData.images.length === 0) {
        setError("Debes subir al menos una imagen del producto")
        setLoading(false)
        return
      }

      const input: CreateProductInput = {
        title: formData.title,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        stock_quantity: Number.parseInt(formData.stock_quantity),
        image_url: formData.images[0] || "",
        images: formData.images,
        category_ids: formData.category_ids,
        tag_ids: formData.tag_ids,
      }

      let result
      if (product) {
        result = await updateProduct({ id: product.id, ...input })
      } else {
        result = await createProduct(input)
      }

      if (result.error) {
        setError(result.error)
      } else {
        router.push("/seller")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }))
  }

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId) ? prev.tag_ids.filter((id) => id !== tagId) : [...prev.tag_ids, tagId],
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Nombre del Producto *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ingresa el nombre del producto"
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe tu producto"
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Precio ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="stock">Cantidad en Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                required
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label>Imágenes del Producto *</Label>
            <div className="mt-2">
              <ImageUploadGrid
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
                maxImages={6}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={formData.category_ids.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={formData.tag_ids.includes(tag.id)}
                  onCheckedChange={() => handleTagToggle(tag.id)}
                />
                <label
                  htmlFor={`tag-${tag.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {tag.name}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? "Actualizar Producto" : "Crear Producto"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
