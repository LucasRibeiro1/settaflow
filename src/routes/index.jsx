import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { PrivateRoute } from '../components/auth/PrivateRoute'
import { RequireJuridico } from '../components/auth/RequireJuridico'
import Login from '../pages/Login'
import Home from '../pages/Home'
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
import JuridicoDashboard from '../pages/Juridico/Dashboard'
import JuridicoMinhaFila from '../pages/Juridico/MinhaFila'
import JuridicoContratos from '../pages/Juridico/Contratos'

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
      { index: true, element: <Home /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'carteira', element: <Carteira /> },
      { path: 'carteira/:id', element: <ClienteDetalhe /> },
      { path: 'titulos', element: <ConsultaTitulos /> },
      { path: 'juridico', element: <TitulosJuridico /> },
      { path: 'tratativas', element: <Tratativas /> },
      { path: 'acordos', element: <Acordos /> },
      { path: 'minha-fila', element: <MinhaFila /> },
      { path: 'juridico-dashboard', element: <RequireJuridico><JuridicoDashboard /></RequireJuridico> },
      { path: 'juridico-fila', element: <RequireJuridico><JuridicoMinhaFila /></RequireJuridico> },
      { path: 'juridico-contratos', element: <RequireJuridico><JuridicoContratos /></RequireJuridico> },
      { path: 'relatorios', element: <Relatorios /> },
      { path: 'configuracoes', element: <Configuracoes /> },
    ],
  },
])
