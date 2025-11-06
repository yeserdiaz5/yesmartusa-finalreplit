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
import { useLanguage } from "@/lib/i18n/LanguageContext"

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
  const { t } = useLanguage()

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
        description: t("pleaseSelectReason"),
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
          title: t("orderCancelledTitle"),
          description: result.message,
        })
        setOpen(false)
        setReason("")
        setAdditionalNotes("")
        onCancelled?.()
      } else {
        toast({
          title: "Error",
          description: result.error || t("couldNotCancelOrder"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: t("errorCancellingOrder"),
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
            {t("cancelOrder")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("cancelOrderTitle")}</DialogTitle>
          <DialogDescription>
            {userType === "seller" 
              ? t("cancelOrderDescriptionSeller")
              : t("cancelOrderDescriptionBuyer")
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t("cancellationReason")} *</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as CancellationReason)}>
              <SelectTrigger id="reason" data-testid="select-cancel-reason">
                <SelectValue placeholder={t("selectReason")} />
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
            <Label htmlFor="notes">{t("additionalNotes")}</Label>
            <Textarea
              id="notes"
              placeholder={t("additionalNotesPlaceholder")}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              data-testid="textarea-cancel-notes"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-900">
              <strong>{t("importantLabel")}</strong> {t("cannotUndoAction")}
              {userType === "buyer" && ` ${t("refundTimeBuyer")}`}
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
            {t("back")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting || !reason}
            data-testid="button-confirm-cancel"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("confirmCancellation")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
