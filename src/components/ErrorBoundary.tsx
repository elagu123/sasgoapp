import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de fallback.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores.
    console.error("Error no capturado en el límite de error:", error, errorInfo);
    // En una app real, podrías registrar esto en un servicio como Sentry, LogRocket, etc.
    // trackError(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de fallback personalizada.
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-center p-8">
                <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">Algo salió mal.</h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                    Lo sentimos, la aplicación encontró un error inesperado.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <button
                    onClick={() => this.setState({ hasError: false }, () => window.location.reload())}
                    className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                    Recargar la página
                    </button>
                    <Link 
                        to="/" 
                        onClick={() => this.setState({ hasError: false })}
                        className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                    Volver al Inicio
                    </Link>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
