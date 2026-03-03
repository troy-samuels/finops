"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[250px] flex-col items-center justify-center rounded-xl bg-white/[0.02] ring-1 ring-white/[0.05] md:h-[400px]">
          <AlertTriangle className="h-5 w-5 text-[#555555]" />
          <p className="mt-3 text-sm text-[#666666]">
            Something went wrong loading the chart.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={this.handleRetry}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
