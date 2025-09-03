

  // Coordenadas de Los Olivos
  const losOlivos = [-11.978, -76.999];

  const map = L.map('map').setView(losOlivos, 14);

  // Capa de mapa
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  // Marcador
  L.marker(losOlivos).addTo(map)
    .bindPopup('Los Olivos')
    .openPopup();

