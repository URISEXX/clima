// app.js

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherCard = document.getElementById('weather-card');

// Variable global para controlar el mapa
let map = null; 

searchBtn.addEventListener('click', async () => {
    const query = cityInput.value.trim();

    if (query === '') {
        weatherCard.innerHTML = '<p style="color: red;">Por favor, ingresa un lugar.</p>';
        return;
    }

    weatherCard.innerHTML = '<p>Consultando la API de OpenStreetMap y Clima... ⏳</p>';

    try {
        // 1. Obtener coordenadas con Nominatim
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&email=22411624@gmail.com`;
        
        const response = await fetch(nominatimUrl, {
            headers: {
                'Accept-Language': 'es' // Pedimos que si hay datos, vengan en español
            }
        });

        if (!response.ok) {
            throw new Error(`El servidor rechazó la petición (Error HTTP ${response.status})`);
        }

        const data = await response.json();

        if (data.length === 0) {
            weatherCard.innerHTML = '<p style="color: #ff4444;">No se encontró la ubicación. Intenta con otro nombre.</p>';
            return;
        }

        const location = data[0];
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);
        const displayName = location.display_name;
        const type = location.type;

        // 2. NUEVO: Obtener el clima usando la latitud y longitud (Open-Meteo)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        const current = weatherData.current_weather;
        // Obtenemos la descripción y el emoji del clima
        const weatherInfo = getWeatherDescription(current.weathercode);

        // Limpiar el mapa anterior si se hace una nueva búsqueda
        if (map !== null) {
            map.remove();
        }

        // 3. Inyectar la información, el CLIMA y el espacio para el mapa en el HTML
        weatherCard.innerHTML = `
            <h2>📍 Ubicación Encontrada</h2>
            <p><strong>Descripción:</strong> ${displayName}</p>
            <p><strong>Tipo:</strong> <span style="text-transform: capitalize;">${type}</span></p>
            
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ccc;">
            
            <!-- NUEVO: SECCIÓN DEL CLIMA -->
            <h3>🌤️ Clima Actual:</h3>
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px; margin-top: 10px;">
                <div style="font-size: 3rem;">${weatherInfo.icon}</div>
                <div>
                    <p style="font-size: 2rem; font-weight: bold; margin: 0; color: #2a5298;">${current.temperature}°C</p>
                    <p style="font-size: 1.1rem; margin: 0; color: #555;">${weatherInfo.text}</p>
                </div>
            </div>

            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ccc;">

            <h3>Coordenadas Exactas:</h3>
            <p><strong>Latitud:</strong> ${lat}</p>
            <p><strong>Longitud:</strong> ${lon}</p>
            
            <!-- Aquí se va a dibujar el mapa -->
            <div id="map" style="height: 250px; width: 100%; margin-top: 15px; border-radius: 8px; border: 1px solid #ccc; z-index: 1;"></div>
        `;

        // Dibujar el mapa en el div con id "map"
        map = L.map('map').setView([lat, lon], 13);

        // Proveedor de mapa libre y sin marcas de agua (OpenStreetMap de Alemania)
        L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        L.marker([lat, lon]).addTo(map);

    } catch (error) {
        // Ahora el error mostrará detalles exactos en la pantalla
        console.error("Error al consultar la API:", error);
        weatherCard.innerHTML = `<p style="color: red;">Ocurrió un error: ${error.message}</p>`;
    }

});

// Permitir buscar con la tecla Enter
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// NUEVO: Función para traducir los códigos del clima a texto y emojis
function getWeatherDescription(code) {
    const weatherCodes = {
        0: { text: "Cielo despejado", icon: "☀️" },
        1: { text: "Mayormente despejado", icon: "🌤️" },
        2: { text: "Parcialmente nublado", icon: "⛅" },
        3: { text: "Nublado", icon: "☁️" },
        45: { text: "Niebla", icon: "🌫️" },
        48: { text: "Niebla con escarcha", icon: "🌫️" },
        51: { text: "Llovizna ligera", icon: "🌦️" },
        61: { text: "Lluvia leve", icon: "🌧️" },
        63: { text: "Lluvia moderada", icon: "🌧️" },
        65: { text: "Lluvia fuerte", icon: "⛈️" },
        71: { text: "Nieve ligera", icon: "🌨️" },
        95: { text: "Tormenta", icon: "🌩️" }
    };
    return weatherCodes[code] || { text: "Desconocido", icon: "🌡️" };
}