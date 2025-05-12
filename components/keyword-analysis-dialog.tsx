"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"
import { KeywordAnalysis } from "./keyword-analysis"
import type { PlatformData } from "@/types"

interface KeywordAnalysisDialogProps {
  platformsData: Record<string, PlatformData | null>
}

export function KeywordAnalysisDialog({ platformsData }: KeywordAnalysisDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full px-3 py-1 h-7 text-xs transition-all hover:bg-primary hover:text-primary-foreground"
      >
        <BarChart3 className="h-3 w-3" />
        <span className="ml-1">关键词分析</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>热搜关键词分析</DialogTitle>
          </DialogHeader>
          <KeywordAnalysis platformsData={platformsData} />
        </DialogContent>
      </Dialog>
    </>
  )
}
