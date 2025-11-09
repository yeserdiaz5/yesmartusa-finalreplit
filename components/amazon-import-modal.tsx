"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, AlertCircle, CheckCircle } from "lucide-react"

interface AmazonListing {
  sku: string
  asin?: string
  title: string
  description: string
  price: number
  images: string[]
  brand?: string
  condition: string
  package_dimensions?: {
    length: number
    width: number
    height: number
    weight: number
  }
}

interface AmazonImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (listing: AmazonListing) => void
}

export default function AmazonImportModal({
  open,
  onOpenChange,
  onImport,
}: AmazonImportModalProps) {
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [sku, setSku] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleConnect = async () => {
    try {
      setConnecting(true)
      setError(null)

      const response = await fetch("/api/amazon/auth")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect to Amazon")
      }

      window.location.href = data.authorize_url
    } catch (err: any) {
      setError(err.message || "Failed to connect to Amazon")
      setConnecting(false)
    }
  }

  const handleImport = async () => {
    if (!sku.trim()) {
      setError("Please enter a SKU")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/amazon/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: sku.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404 && data.error?.includes("not connected")) {
          setError(
            "Amazon account not connected. Please connect your Amazon account first."
          )
        } else {
          throw new Error(data.error || "Failed to import product")
        }
        return
      }

      setSuccess("Product imported successfully!")
      onImport(data.listing)
      
      setTimeout(() => {
        onOpenChange(false)
        setSku("")
        setSuccess(null)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to import product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Import from Amazon
          </DialogTitle>
          <DialogDescription>
            Import product details from your Amazon Seller Central account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              To import a product, you need to know the SKU (Stock Keeping Unit) of the
              product in your Amazon inventory. You can find SKUs in Amazon Seller Central
              under <strong>Inventory → Manage Inventory</strong>.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="sku">Amazon SKU</Label>
            <Input
              id="sku"
              placeholder="MY-PRODUCT-SKU-123"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleImport()
                }
              }}
              data-testid="input-amazon-sku"
            />
            <p className="text-sm text-muted-foreground">
              Enter the exact SKU as it appears in your Amazon inventory
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-900">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleConnect}
            disabled={connecting || loading}
            className="flex-1"
            data-testid="button-connect-amazon"
          >
            {connecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Connect Amazon Account
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || !sku.trim()}
            className="flex-1"
            data-testid="button-import-amazon"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Import Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
