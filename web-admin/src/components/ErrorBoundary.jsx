import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl max-w-sm">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-700 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-red-600 mb-4">
              {this.state.error?.message || 'ไม่สามารถแสดงผลได้'}
            </p>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <RefreshCw size={14} />
              ลองใหม่
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
