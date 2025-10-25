import React from "react";
import "../../css/Vista_usuario/prevencion.css";

export default function Prevencion() {
  const cards = [
    { icon: "🚶‍♂️", title: "Vía Pública", desc: "Evita calles solitarias o mal iluminadas y mantente alerta." },
    { icon: "🏠", title: "Hogar", desc: "Cierra puertas, no abras a desconocidos y usa cámaras si es posible." },
    { icon: "💻", title: "Digital", desc: "Contraseñas seguras, evita compartir info y cuidado con estafas." },
    { icon: "📞", title: "Emergencias", desc: "Policía: 105 | Bomberos: 116 | Serenazgo: 123." },
    { icon: "🛡️", title: "Autoprotección", desc: "Aprende técnicas básicas de defensa personal y siempre ten contacto de confianza." },
    { icon: "📱", title: "Apps de Seguridad", desc: "Instala aplicaciones oficiales de seguridad y alertas locales." },
    { icon: "🔦", title: "Iluminación", desc: "Usa linterna en zonas oscuras y mantén luces encendidas en tu hogar." },
    { icon: "🧴", title: "Prevención Sanitaria", desc: "Mantén higiene personal y kits básicos de emergencia siempre listos." }
  ];

  return (
    <section className="prevencion-section">
      {cards.map((card, idx) => (
        <div key={idx} className="prevencion-card">
          <div className="icon">{card.icon}</div>
          <h3>{card.title}</h3>
          <p>{card.desc}</p>
        </div>
      ))}
    </section>
  );
}
