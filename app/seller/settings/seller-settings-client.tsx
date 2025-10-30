"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2, Store, MapPin } from "lucide-react"
import { updateSellerSettings, type UpdateSellerSettingsInput } from "@/app/actions/seller"
import { useToast } from "@/hooks/use-toast"

interface SellerSettingsClientProps {
  user: {
    id: string
    email: string
    full_name: string | null
    store_name: string | null
    seller_address: any
    phone: string | null
  }
}

export default function SellerSettingsClient({ user }: SellerSettingsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    store_name: user.store_name || "",
    full_name: user.seller_address?.full_name || user.full_name || "",
    address_line1: user.seller_address?.address_line1 || "",
    address_line2: user.seller_address?.address_line2 || "",
    city: user.seller_address?.city || "",
    state: user.seller_address?.state || "",
    postal_code: user.seller_address?.postal_code || "",
    country: user.seller_address?.country || "US",
    phone: user.seller_address?.phone || user.phone || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const input: UpdateSellerSettingsInput = {
        store_name: formData.store_name,
        seller_address: {
          full_name: formData.full_name,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
          phone: formData.phone,
        },
      }

      const result = await updateSellerSettings(input)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Configuración actualizada",
          description: "Tu información de vendedor ha sido actualizada correctamente",
        })
        router.push("/seller")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <CardTitle>Información de la Tienda</CardTitle>
          </div>
          <CardDescription>Configura el nombre de tu tienda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="store_name">Nombre de la Tienda *</Label>
            <Input
              id="store_name"
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              required
              placeholder="Ej: TechGear Pro, Fashion Boutique"
            />
            <p className="text-sm text-gray-500 mt-1">Este nombre aparecerá en tus productos y etiquetas de envío</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <CardTitle>Dirección de Envío</CardTitle>
          </div>
          <CardDescription>Esta dirección se usará como remitente en las etiquetas de envío</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="17867511111"
              type="tel"
            />
            <p className="text-sm text-gray-500 mt-1">Formato: 10 dígitos sin espacios ni guiones</p>
          </div>

          <div>
            <Label htmlFor="address_line1">Dirección Línea 1 *</Label>
            <Input
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              required
              placeholder="Calle y número"
            />
          </div>

          <div>
            <Label htmlFor="address_line2">Dirección Línea 2 (Opcional)</Label>
            <Input
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              placeholder="Apartamento, suite, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                placeholder="Ciudad"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                placeholder="FL"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postal_code">Código Postal *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                required
                placeholder="33101"
              />
            </div>

            <div>
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
                placeholder="US"
                maxLength={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Guardar Configuración
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
