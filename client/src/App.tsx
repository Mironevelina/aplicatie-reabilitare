import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pagini Publice
import Home from './pages/shared/Home';
import Login from './pages/shared/Login';
import SignUp from './pages/shared/SignUp';
import ForgotPassword from './pages/shared/ForgotPassword';
import PublicDashboard from './pages/shared/PublicDashboard';
import ContactPage from './pages/shared/ContactPage';
import ProfilePage from './pages/shared/ProfilePage';

// Importuri Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSessions from './pages/admin/AdminSessions';
import AdminPatients from './pages/admin/AdminPatients';
import AdminDoctors from './pages/admin/AdminDoctors';
import PatientDetails from './pages/admin/PatientDetails';
import UserManagement from './pages/admin/UserManagement';
import DoctorDetails from './pages/admin/DoctorDetails';
import AdminMessages from './pages/admin/AdminMessages';

// Importuri Medic
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientStats from './pages/doctor/PatientStats'; 

// Importuri Pacient
import PatientDashboard from './pages/patient/PatientDashboard';
import Congratulations from './pages/patient/Congratulations';
import ExercisePage from './pages/patient/ExercisePage';
import ProgressPage from './pages/patient/ProgressPage';
import PinchExercisePage from "./pages/patient/PinchExercisePage";
import {MazeExercisePage} from "./pages/patient/MazeExercisePage";
import { FingersExercisePage } from "./pages/patient/FingersExercisePage";

function RoleBasedRedirect() {
  // Preluăm rolul utilizatorului (salvat la login în localStorage sau în contextul aplicației)
  const userRole = localStorage.getItem('userRole'); 

  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (userRole === 'doctor') {
    return <Navigate to="/doctor-dashboard" replace />;
  } else if (userRole === 'patient') {
    return <Navigate to="/dashboard" replace />;
  }

  // Dacă nu este găsit niciun rol valid, trimitem utilizatorul înapoi la Home
  return <Navigate to="/" replace />;
}
function App() {
  return (
    <Router>
      <Routes>
        {/* --- PAGINI PUBLICE --- */}
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<PublicDashboard />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* --- RUTE AUTENTIFICARE --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
       <Route path="/redirect" element={<RoleBasedRedirect />} />
        {/* --- RUTE ADMIN --- */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/sessions" element={<AdminSessions />} />
        <Route path="/admin/patients" element={<AdminPatients />} />
        <Route path="/admin/doctors" element={<AdminDoctors />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/pacient/:id" element={<PatientDetails />} />
        <Route path="/admin/doctor/:id" element={<DoctorDetails />} />
        <Route path="/admin/messages" element={<AdminMessages />} />

        {/* --- RUTE MEDIC --- */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/patient-stats/:id" element={<PatientStats />} />

        {/* --- RUTE PACIENT --- */}
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/exercitiu" element={<ExercisePage />} />
        <Route path="/felicitari" element={<Congratulations />} />
        <Route path="/progres" element={<ProgressPage />} />
        
        {/* ALINIERE RUTE EXERCIȚII (Sincronizate perfect cu butoanele din Dashboard) */}
        <Route path="/exercitiu-prindere" element={<PinchExercisePage />} />
        <Route path="/exercitiu-traseu" element={<MazeExercisePage />} />
        <Route path="/exercitiu-degete" element={<FingersExercisePage />} />
        {/* --- RUTE COMUNE (Logați) --- */}
        <Route path="/profil" element={<ProfilePage />} />
        
        {/* --- FALLBACK --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;