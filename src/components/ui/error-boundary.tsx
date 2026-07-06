"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-lg font-medium text-destructive">
            Algo salió mal
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {this.state.error?.message || "Ocurrió un error inesperado."}
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={this.handleRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
