"use client"

import { Upload, RefreshCw, TrendingUp, AlertCircle } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface SimulationData {
  current_runway: number
  monthly_burn_rate: number
  recommended_budget: number
  confidence_score: number
  currency: string
}

export default function RunwaySimulator() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SimulationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/analyze-file", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to analyze file")
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError("Failed to process file. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Runway Simulator
        </CardTitle>
        <CardDescription>
          Upload your transaction history to simulate your startup&apos;s runway.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="relative" disabled={loading}>
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Transaction History
              <Input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                accept=".csv,.xlsx,.xls"
              />
            </Button>
            <span className="text-sm text-muted-foreground">
              Supports CSV, Excel (KR/EN/JP/CN/ES)
            </span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="runway">Current Runway (Months)</Label>
              <Input
                id="runway"
                type="number"
                value={data?.current_runway || ""}
                readOnly
                placeholder="Calculated runway..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="burn-rate">Monthly Burn Rate</Label>
              <Input
                id="burn-rate"
                type="number"
                value={data?.monthly_burn_rate || ""}
                readOnly
                placeholder="Calculated burn rate..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Target Budget</Label>
              <Input
                id="budget"
                type="number"
                value={data?.recommended_budget || ""}
                readOnly
                placeholder="Recommended budget..."
              />
            </div>
            <div className="space-y-2">
              <Label>Confidence Score</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[data ? data.confidence_score * 100 : 0]}
                  max={100}
                  step={1}
                  disabled
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">
                  {data ? `${(data.confidence_score * 100).toFixed(0)}%` : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
