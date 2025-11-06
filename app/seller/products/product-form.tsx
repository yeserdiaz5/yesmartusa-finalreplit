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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProduct, updateProduct, type CreateProductInput } from "@/app/actions/products"
import type { Category, Tag, Product, ShippingPolicy } from "@/lib/types/database"
import { ArrowLeft, Loader2 } from "lucide-react"
import ImageUploadGrid from "@/components/image-upload-grid"
import { useLanguage } from "@/lib/i18n/LanguageContext"

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
  const { t } = useLanguage()
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
    shipping_policy: (product?.shipping_policy || "buyer_pays") as ShippingPolicy,
    shipping_cost: product?.shipping_cost?.toString() || "",
  })

  console.log("[v0] Form data images:", formData.images)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!product && formData.images.length === 0) {
        setError(t("mustUploadImage"))
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
        shipping_policy: formData.shipping_policy,
        shipping_cost: formData.shipping_cost ? Number.parseFloat(formData.shipping_cost) : null,
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
      setError(t("unexpectedError"))
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
        <Button type="button" variant="ghost" onClick={() => router.back()} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backButton")}
        </Button>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800" data-testid="text-error">{error}</div>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("productInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">{t("productName")} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder={t("productNamePlaceholder")}
              data-testid="input-product-name"
            />
          </div>

          <div>
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("productDescriptionPlaceholder")}
              rows={5}
              data-testid="input-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">{t("price")} *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="0.00"
                data-testid="input-price"
              />
            </div>

            <div>
              <Label htmlFor="stock">{t("stockQuantity")} *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                required
                placeholder="0"
                data-testid="input-stock"
              />
            </div>
          </div>

          <div>
            <Label>{t("productImages")} *</Label>
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
          <CardTitle>{t("shippingPolicy")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shipping_policy">{t("shippingPolicyDescription")}</Label>
            <Select
              value={formData.shipping_policy}
              onValueChange={(value: ShippingPolicy) => 
                setFormData({ ...formData, shipping_policy: value })
              }
            >
              <SelectTrigger id="shipping_policy" data-testid="select-shipping-policy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seller_pays" data-testid="option-seller-pays">
                  {t("sellerPaysShipping")}
                </SelectItem>
                <SelectItem value="buyer_pays" data-testid="option-buyer-pays">
                  {t("buyerPaysShipping")}
                </SelectItem>
                <SelectItem value="shared" data-testid="option-shared">
                  {t("sharedShipping")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="shipping_cost">{t("shippingCost")} (opcional)</Label>
            <Input
              id="shipping_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.shipping_cost}
              onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
              placeholder={t("shippingCostPlaceholder")}
              data-testid="input-shipping-cost"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.shipping_policy === 'seller_pays' && t("freeShipping")}
              {formData.shipping_policy === 'buyer_pays' && `${t("buyer")} ${t("shippingPaidBy").toLowerCase()}`}
              {formData.shipping_policy === 'shared' && t("sharedCost")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("categories")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={formData.category_ids.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  data-testid={`checkbox-category-${category.id}`}
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
          <CardTitle>{t("tags")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={formData.tag_ids.includes(tag.id)}
                  onCheckedChange={() => handleTagToggle(tag.id)}
                  data-testid={`checkbox-tag-${tag.id}`}
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
        <Button type="submit" disabled={loading} className="flex-1" data-testid="button-submit">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? t("updateProduct") : t("createProduct")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} data-testid="button-cancel">
          {t("cancel")}
        </Button>
      </div>
    </form>
  )
}
