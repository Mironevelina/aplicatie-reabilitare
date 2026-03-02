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
import AdminMessages from './pages/admin/AdminMessages'; // <-- Import nou pentru mesaje

// Importuri Medic
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientStats from './pages/doctor/PatientStats'; 

// Importuri Pacient
import PatientDashboard from './pages/patient/PatientDashboard';
import Congratulations from './pages/patient/Congratulations';
import ExercisePage from './pages/patient/ExercisePage';
import ProgressPage from './pages/patient/ProgressPage';

function App() {
  return (
    <Router>
      {/* Sfat: SakuraLayout este deja folosit în interiorul fiecărei pagini (conform codului anterior).
        Dacă dorești să îl pui aici global, ar trebui să înfășoare <Routes>, 
        dar momentan paginile tale îl conțin deja individual.
      */}
      <Routes>
        {/* --- PAGINI PUBLICE --- */}
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<PublicDashboard />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* --- RUTE AUTENTIFICARE --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* --- RUTE ADMIN --- */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/sessions" element={<AdminSessions />} />
        <Route path="/admin/patients" element={<AdminPatients />} />
        <Route path="/admin/doctors" element={<AdminDoctors />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/pacient/:id" element={<PatientDetails />} />
        <Route path="/admin/doctor/:id" element={<DoctorDetails />} />
        <Route path="/admin/messages" element={<AdminMessages />} /> {/* <-- Ruta pentru Inbox-ul Adminului */}

        {/* --- RUTE MEDIC --- */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/patient-stats/:id" element={<PatientStats />} />

        {/* --- RUTE PACIENT --- */}
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/exercitiu" element={<ExercisePage />} />
        <Route path="/felicitari" element={<Congratulations />} />
        <Route path="/progres" element={<ProgressPage />} />
        
        {/* --- RUTE COMUNE (Logați) --- */}
        <Route path="/profil" element={<ProfilePage />} />
        
        {/* --- FALLBACK --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;