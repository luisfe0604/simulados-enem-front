import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const tokenFromStorage = localStorage.getItem("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      window.history.replaceState({}, document.title, "/");
      navigate("/", { replace: true });
    } 
    else if (tokenFromStorage) {
      navigate("/", { replace: true });
    } 
    else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return <div>Entrando...</div>;
}