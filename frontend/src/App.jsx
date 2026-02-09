import { FundProvider } from './store/context/FundContext'
import Home from './pages/Home'

function App() {
  return (
    <FundProvider>
      <Home />
    </FundProvider>
  )
}

export default App
