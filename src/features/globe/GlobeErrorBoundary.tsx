"use client";

import { Component, type ReactNode } from "react";

interface Props {
  onError: (error: unknown) => void;
  children: ReactNode;
}

/** 攔截 3D 畫面建立時的錯誤（例如顯示卡剛好被重置），交給上層決定要不要重試，避免整頁當掉。 */
export class GlobeErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
