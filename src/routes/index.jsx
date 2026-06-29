import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { PrivateRoute } from '../components/auth/PrivateRoute'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Carteira from '../pages/Carteira'
import ClienteDetalhe from '../pages/Cliente'
import Tratativas from '../pages/Tratativas'
import Acordos from '../pages/Acordos'
import MinhaFila from '../pages/MinhaFila'
import Relatorios from '../pages/Relatorios'
import Configuracoes from '../pages/Configuracoes'
import ConsultaTitulos from '../pages/Titulos'
import TitulosJuridico from '../pages/TitulosJuridico'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'carteira', element: <Carteira /> },
      { path: 'carteira/:id', element: <ClienteDetalhe /> },
      { path: 'titulos', element: <ConsultaTitulos /> },
      { path: 'juridico', element: <TitulosJuridico /> },
      { path: 'tratativas', element: <Tratativas /> },
      { path: 'acordos', element: <Acordos /> },
      { path: 'minha-fila', element: <MinhaFila /> },
      { path: 'relatorios', element: <Relatorios /> },
      { path: 'configuracoes', element: <Configuracoes /> },
    ],
  },
])
