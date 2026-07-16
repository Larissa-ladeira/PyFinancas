import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
          <div className="glass-card max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-pink/20 border border-accent-pink/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Algo deu errado</h2>
            <p className="text-sm text-white/50 mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button onClick={() => window.location.reload()}
              className="btn-primary">
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
