import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import SakuraLayout from "../../layouts/SakuraLayout";

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string | null;
  email?: string;
  created_at: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Preluăm rolul din metadate
          const role = user.user_metadata?.role || "pacient";
          const tableName =
            role === "doctor" || role === "medic" ? "doctori" : "pacienti";

          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", user.id)
            .single();

          if (data) {
            setProfile({
              id: data.id,
              full_name: data.full_name,
              role: role,
              email: user.email,
              created_at: data.created_at || user.created_at,
            });
          }
        }
      } catch (err) {
        console.error("Eroare la încărcarea profilului:", err);
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, []);

  // FUNCTIE NOUA: Navigare dinamică în funcție de rol
  const handleDashboardNavigation = () => {
    if (!profile) return;

    const role = profile.role?.toLowerCase();

    if (role === "doctor" || role === "medic") {
      navigate("/doctor-dashboard");
    } else if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard"); // Pentru pacienți
    }
  };

  if (loading) {
    return (
      <SakuraLayout>
        <div style={styles.container}>Se încarcă profilul...</div>
      </SakuraLayout>
    );
  }

  return (
    <SakuraLayout>
      <div style={styles.container}>
        <div style={styles.backWrapper}>
          <button
            style={styles.circleBackButton}
            onClick={() => navigate(-1)}
            title="Înapoi"
          >
            ←
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.avatarLarge}>
            {profile?.full_name?.[0] ||
              profile?.email?.[0].toUpperCase() ||
              "U"}
          </div>

          <h2 style={{ color: "#4d444a", marginBottom: "5px" }}>
            {profile?.full_name || "Utilizator"}
          </h2>

          <p style={{ color: "#8a7d84" }}>
            Rol:{" "}
            <strong style={{ color: "#ff6b81", textTransform: "capitalize" }}>
              {profile?.role}
            </strong>
          </p>

          <div style={styles.divider} />

          <div style={styles.infoGrid}>
            <div>
              <label style={styles.labelStyle}>Email</label>
              <p style={styles.dataStyle}>{profile?.email || "Nespecificat"}</p>
            </div>
            <div>
              <label style={styles.labelStyle}>Membru din</label>
              <p style={styles.dataStyle}>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("ro-RO")
                  : "-"}
              </p>
            </div>
          </div>

          <div style={{ marginTop: "30px" }}>
            <button
              onClick={handleDashboardNavigation} // Apelăm funcția de navigare dinamică
              style={styles.editBtn}
            >
              Mergi la Dashboard
            </button>
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "60px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "80vh",
  },
  backWrapper: {
    width: "100%",
    maxWidth: "500px",
    textAlign: "left",
    marginBottom: "15px",
  },
  circleBackButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "white",
    border: "1px solid #f0f0f0",
    color: "#4d444a",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "all 0.2s",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "40px",
    boxShadow: "0 20px 50px rgba(255, 183, 197, 0.15)",
    width: "100%",
    maxWidth: "500px",
    textAlign: "center",
    border: "1px solid rgba(255, 183, 197, 0.2)",
  },
  avatarLarge: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    backgroundColor: "#ffb7c5",
    color: "white",
    fontSize: "40px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    boxShadow: "0 8px 20px rgba(255, 183, 197, 0.4)",
  },
  divider: { height: "1px", backgroundColor: "#f9f9f9", margin: "25px 0" },
  labelStyle: {
    fontSize: "11px",
    color: "#b2a4ac",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "700",
  },
  dataStyle: {
    fontSize: "16px",
    color: "#4d444a",
    fontWeight: "600",
    marginTop: "5px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    textAlign: "center",
  },
  editBtn: {
    padding: "12px 30px",
    backgroundColor: "transparent",
    border: "2px solid #ffb7c5",
    color: "#ff6b81",
    borderRadius: "20px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

export default ProfilePage;
