"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, XCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  cancelOrderByEmail, 
  getBuyerCancellationReasons,
  type CancellationReason 
} from "@/app/actions/cancel-order"
import Link from "next/link"

interface CancelOrderPageClientProps {
  orderId: string
}

export default function CancelOrderPageClient({ orderId }: CancelOrderPageClientProps) {
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState<CancellationReason | "">("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [reasons, setReasons] = useState<{ value: string; label: string }[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadReasons = async () => {
      const reasonsList = await getBuyerCancellationReasons()
      setReasons(reasonsList)
    }
    loadReasons()
  }, [])

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !reason) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await cancelOrderByEmail({
        orderId,
        email,
        reason: reason as CancellationReason,
        additionalNotes: additionalNotes || undefined,
      })

      if (result.success) {
        setCancelled(true)
        toast({
          title: "Pedido cancelado",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo cancelar el pedido",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al cancelar el pedido",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle>Pedido Cancelado</CardTitle>
            <CardDescription>
              Tu pedido ha sido cancelado exitosamente. Si realizaste un pago, recibirás un reembolso en los próximos 5-10 días hábiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-go-home">
                Volver al Inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <CardTitle>Cancelar Pedido</CardTitle>
              <CardDescription>Pedido #{orderId.slice(0, 8)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCancel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email usado en la compra *</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-cancel-email"
              />
              <p className="text-sm text-gray-600">
                Ingresa el email que usaste al realizar la compra
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Razón de cancelación *</Label>
              <Select value={reason} onValueChange={(value) => setReason(value as CancellationReason)}>
                <SelectTrigger id="reason" data-testid="select-guest-cancel-reason">
                  <SelectValue placeholder="Selecciona una razón" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agrega detalles adicionales sobre la cancelación..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                data-testid="textarea-guest-cancel-notes"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>Importante:</strong> Esta acción no se puede deshacer. El reembolso puede tardar de 5 a 10 días hábiles en reflejarse.
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-guest-cancel-back"
                >
                  Volver
                </Button>
              </Link>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={isSubmitting || !email || !reason}
                data-testid="button-guest-confirm-cancel"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cancelar Pedido
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
