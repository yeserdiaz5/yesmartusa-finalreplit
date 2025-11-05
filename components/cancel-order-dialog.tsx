"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  cancelOrder, 
  getSellerCancellationReasons, 
  getBuyerCancellationReasons,
  type CancellationReason 
} from "@/app/actions/cancel-order"

interface CancelOrderDialogProps {
  orderId: string
  userType: "seller" | "buyer"
  onCancelled?: () => void
  trigger?: React.ReactNode
}

export function CancelOrderDialog({ 
  orderId, 
  userType, 
  onCancelled,
  trigger 
}: CancelOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<CancellationReason | "">("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reasons, setReasons] = useState<{ value: string; label: string }[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadReasons = async () => {
      const reasonsList = userType === "seller" 
        ? await getSellerCancellationReasons() 
        : await getBuyerCancellationReasons()
      setReasons(reasonsList)
    }
    loadReasons()
  }, [userType])

  const handleCancel = async () => {
    if (!reason) {
      toast({
        title: "Error",
        description: "Por favor selecciona una razón para cancelar",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await cancelOrder({
        orderId,
        reason: reason as CancellationReason,
        additionalNotes: additionalNotes || undefined,
        userType,
      })

      if (result.success) {
        toast({
          title: "Pedido cancelado",
          description: result.message,
        })
        setOpen(false)
        setReason("")
        setAdditionalNotes("")
        onCancelled?.()
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="destructive" 
            size="sm"
            data-testid="button-cancel-order"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancelar Pedido
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancelar Pedido</DialogTitle>
          <DialogDescription>
            {userType === "seller" 
              ? "Al cancelar este pedido, se procesará un reembolso automático al comprador si el pago ya fue procesado."
              : "Al cancelar este pedido, recibirás un reembolso automático si el pago ya fue procesado."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Razón de cancelación *</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as CancellationReason)}>
              <SelectTrigger id="reason" data-testid="select-cancel-reason">
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
              data-testid="textarea-cancel-notes"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-900">
              <strong>Importante:</strong> Esta acción no se puede deshacer. 
              {userType === "buyer" && " El reembolso puede tardar de 5 a 10 días hábiles en reflejarse."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            data-testid="button-cancel-dialog-close"
          >
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting || !reason}
            data-testid="button-confirm-cancel"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Cancelación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
