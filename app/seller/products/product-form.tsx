"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
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
  const { t, language } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)
  const [generatingDescription, setGeneratingDescription] = useState(false)

  console.log("[v0] Product data:", product)
  console.log("[v0] Product images:", product?.images)
  console.log("[v0] Product image_url:", product?.image_url)

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    stock_quantity: product?.stock_quantity?.toString() || "",
    brand: product?.brand || "",
    condition: product?.condition || "new",
    images:
      product?.images && product.images.length > 0 ? product.images : product?.image_url ? [product.image_url] : [],
    category_ids: productCategories,
    tag_ids: productTags,
    shipping_policy: (product?.shipping_policy || "buyer_pays") as ShippingPolicy,
    shipping_cost: product?.shipping_cost?.toString() || "",
    package_length: product?.package_length?.toString() || "",
    package_width: product?.package_width?.toString() || "",
    package_height: product?.package_height?.toString() || "",
    package_weight: product?.package_weight?.toString() || "",
  })

  console.log("[v0] Form data images:", formData.images)

  // Automatically estimate shipping when all dimensions are filled
  useEffect(() => {
    const estimateShippingAutomatically = async () => {
      // Check if all dimensions are filled and valid
      if (
        formData.package_length &&
        formData.package_width &&
        formData.package_height &&
        formData.package_weight &&
        parseFloat(formData.package_length) > 0 &&
        parseFloat(formData.package_width) > 0 &&
        parseFloat(formData.package_height) > 0 &&
        parseFloat(formData.package_weight) > 0
      ) {
        setEstimating(true)
        setError(null)

        try {
          const response = await fetch("/api/estimate-shipping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              package_length: parseFloat(formData.package_length),
              package_width: parseFloat(formData.package_width),
              package_height: parseFloat(formData.package_height),
              package_weight: parseFloat(formData.package_weight),
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || t("shippingEstimateError"))
          }

          // Set the estimated cost
          setEstimatedCost(data.estimated_cost)

          // Pre-fill the shipping cost field
          setFormData((prev) => ({
            ...prev,
            shipping_cost: data.estimated_cost.toString(),
          }))

          console.log("[v0] Shipping estimated automatically:", data)
        } catch (err) {
          console.error("[v0] Error estimating shipping:", err)
          // Don't show error to user for automatic estimation
        } finally {
          setEstimating(false)
        }
      }
    }

    estimateShippingAutomatically()
  }, [formData.package_length, formData.package_width, formData.package_height, formData.package_weight, t])

  const handleGenerateDescription = async () => {
    // Validate product name is filled
    if (!formData.title || formData.title.trim() === "") {
      setError(t("productNameRequired"))
      return
    }

    setGeneratingDescription(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: formData.title,
          language: language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("descriptionGenerateError"))
      }

      // Pre-fill the description field
      setFormData((prev) => ({
        ...prev,
        description: data.description,
      }))

      console.log("[v0] Description generated:", data.description)
    } catch (err) {
      console.error("[v0] Error generating description:", err)
      setError(err instanceof Error ? err.message : t("descriptionGenerateError"))
    } finally {
      setGeneratingDescription(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate at least one image is required
      if (formData.images.length === 0) {
        setError(t("mustUploadImage"))
        setLoading(false)
        return
      }

      // Validate shipping cost is required for buyer_pays and shared policies
      if ((formData.shipping_policy === 'buyer_pays' || formData.shipping_policy === 'shared') && !formData.shipping_cost) {
        setError(t("shippingCostRequired"))
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
        brand: formData.brand || null,
        condition: formData.condition || null,
        category_ids: formData.category_ids,
        tag_ids: formData.tag_ids,
        shipping_policy: formData.shipping_policy,
        shipping_cost: formData.shipping_cost ? Number.parseFloat(formData.shipping_cost) : null,
        package_length: formData.package_length ? Number.parseFloat(formData.package_length) : null,
        package_width: formData.package_width ? Number.parseFloat(formData.package_width) : null,
        package_height: formData.package_height ? Number.parseFloat(formData.package_height) : null,
        package_weight: formData.package_weight ? Number.parseFloat(formData.package_weight) : null,
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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description">{t("description")} *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generatingDescription || !formData.title}
                data-testid="button-generate-description"
              >
                {generatingDescription ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("generateDescription")}
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("productDescriptionPlaceholder")}
              rows={5}
              required
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">{t("productBrand")}</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder={t("productBrandPlaceholder")}
                data-testid="input-brand"
              />
            </div>

            <div>
              <Label htmlFor="condition">{t("productCondition")}</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value as "new" | "used" })}
              >
                <SelectTrigger id="condition" data-testid="select-condition">
                  <SelectValue placeholder={t("productConditionPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" data-testid="option-condition-new">{t("productConditionNew")}</SelectItem>
                  <SelectItem value="used" data-testid="option-condition-used">{t("productConditionUsed")}</SelectItem>
                </SelectContent>
              </Select>
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
          <CardTitle>{t("packageDimensions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="package_length">{t("lengthInches")} *</Label>
              <Input
                id="package_length"
                type="number"
                step="0.01"
                min="0"
                value={formData.package_length}
                onChange={(e) => setFormData({ ...formData, package_length: e.target.value })}
                placeholder="10"
                required
                data-testid="input-package-length"
              />
            </div>

            <div>
              <Label htmlFor="package_width">{t("widthInches")} *</Label>
              <Input
                id="package_width"
                type="number"
                step="0.01"
                min="0"
                value={formData.package_width}
                onChange={(e) => setFormData({ ...formData, package_width: e.target.value })}
                placeholder="8"
                required
                data-testid="input-package-width"
              />
            </div>

            <div>
              <Label htmlFor="package_height">{t("heightInches")} *</Label>
              <Input
                id="package_height"
                type="number"
                step="0.01"
                min="0"
                value={formData.package_height}
                onChange={(e) => setFormData({ ...formData, package_height: e.target.value })}
                placeholder="6"
                required
                data-testid="input-package-height"
              />
            </div>

            <div>
              <Label htmlFor="package_weight">{t("weightPounds")} *</Label>
              <Input
                id="package_weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.package_weight}
                onChange={(e) => setFormData({ ...formData, package_weight: e.target.value })}
                placeholder="2"
                required
                data-testid="input-package-weight"
              />
            </div>
          </div>

          {estimating && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("estimating")}
            </p>
          )}
          {estimatedCost !== null && !estimating && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
              {t("shippingEstimated").replace("${cost}", estimatedCost.toString())}
            </p>
          )}
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
            <Label htmlFor="shipping_cost">
              {t("shippingCost")} 
              {formData.shipping_policy === 'seller_pays' && " (opcional)"}
              {(formData.shipping_policy === 'buyer_pays' || formData.shipping_policy === 'shared') && " *"}
            </Label>
            <Input
              id="shipping_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.shipping_cost}
              onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
              placeholder={t("shippingCostPlaceholder")}
              data-testid="input-shipping-cost"
              required={formData.shipping_policy === 'buyer_pays' || formData.shipping_policy === 'shared'}
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
