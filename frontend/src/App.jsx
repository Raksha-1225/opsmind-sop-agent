import React from 'react'
import Context from './Components/Context'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger">
            Something went wrong. Please refresh the page.
            <button className="btn btn-sm btn-outline-danger ms-3"
              onClick={() => this.setState({ hasError: false })}>
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Context />
    </ErrorBoundary>
  )
}

export default App