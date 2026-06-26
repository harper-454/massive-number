'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PanelErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`PanelErrorBoundary (${this.props.name}):`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-red-500/15 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">
              {this.props.name || 'Panel'} Error
            </h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-md">
              {this.state.error?.message || 'An unexpected error occurred while loading this panel.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
