import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Redux's <Provider> works the same way ThemeProvider/AuthProvider do —
        it's Context under the hood too — but instead of one plain value,
        it exposes the whole store, readable via useSelector and
        updatable via useDispatch from any component below it. */}
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          {/* BrowserRouter uses the History API so URLs look like /employees
              instead of /#/employees, and makes routing context available
              to every component below it via useNavigate/useLocation/etc. */}
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
