// Configuración
const API_BASE = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

// Estado global
let websocket = null;
let isConnected = false;
let sensorData = {
    ph: [],
    temp: [],
    lux: []
};
let maxDataPoints = 300; // 5 minutos a 1 punto/segundo

// Estado de actuadores
let actuadores = {
    valvula: false,
    resistencia: false,
    led: false
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    inicializarGraficas();
    conectarWebSocket();
    cargarHistorial();
    configurarEventos();
});

// Inicializar gráficas con Plotly
function inicializarGraficas() {
    const layoutBase = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f1f5f9', family: 'Inter, sans-serif' },
        margin: { t: 30, r: 20, l: 50, b: 30 },
        xaxis: { 
            gridcolor: '#334155',
            showgrid: true,
            zerolinecolor: '#334155'
        },
        yaxis: { 
            gridcolor: '#334155',
            showgrid: true,
            zerolinecolor: '#334155'
        },
        showlegend: false
    };

    // Gráfica pH
    const phTrace = {
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        line: { color: '#3b82f6', width: 2, shape: 'spline' },
        fill: 'tozeroy',
        fillcolor: 'rgba(59, 130, 246, 0.1)'
    };

    Plotly.newPlot('phChart', [phTrace], {
        ...layoutBase,
        title: { text: '' },
        yaxis: { ...layoutBase.yaxis, title: 'pH', range: [0, 14] }
    });

    // Gráfica Temperatura
    const tempTrace = {
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        line: { color: '#f59e0b', width: 2, shape: 'spline' },
        fill: 'tozeroy',
        fillcolor: 'rgba(245, 158, 11, 0.1)'
    };

    Plotly.newPlot('tempChart', [tempTrace], {
        ...layoutBase,
        title: { text: '' },
        yaxis: { ...layoutBase.yaxis, title: '°C', range: [0, 50] }
    });

    // Gráfica Luz
    const luxTrace = {
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        line: { color: '#10b981', width: 2, shape: 'spline' },
        fill: 'tozeroy',
        fillcolor: 'rgba(16, 185, 129, 0.1)'
    };

    Plotly.newPlot('luxChart', [luxTrace], {
        ...layoutBase,
        title: { text: '' },
        yaxis: { ...layoutBase.yaxis, title: 'lux', range: [0, 1000] }
    });
}

// Conectar WebSocket
function conectarWebSocket() {
    websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
        isConnected = true;
        actualizarEstadoConexion(true);
        console.log('✅ WebSocket conectado');
    };

    websocket.onclose = () => {
        isConnected = false;
        actualizarEstadoConexion(false);
        console.log('❌ WebSocket desconectado');
        setTimeout(conectarWebSocket, 3000);
    };

    websocket.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        isConnected = false;
        actualizarEstadoConexion(false);
    };

    websocket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            recibirDatos(data);
        } catch (error) {
            console.error('Error al parsear mensaje WebSocket:', error);
        }
    };
}

// Recibir datos del WebSocket
function recibirDatos(data) {
    if (!data.sensores) return;

    const { ph, temp, lux } = data.sensores;
    const timestamp = new Date(data.timestamp);

    // Actualizar datos para gráficas
    sensorData.ph.push({ x: timestamp, y: ph });
    sensorData.temp.push({ x: timestamp, y: temp });
    sensorData.lux.push({ x: timestamp, y: lux });

    // Limpiar datos antiguos
    if (sensorData.ph.length > maxDataPoints) {
        sensorData.ph.shift();
        sensorData.temp.shift();
        sensorData.lux.shift();
    }

    // Actualizar UI
    actualizarStats(ph, temp, lux);
    actualizarGraficas();
    actualizarEstadoActuadores(data.estado);
}

// Actualizar tarjetas de estadísticas
function actualizarStats(ph, temp, lux) {
    // pH
    document.getElementById('phValue').textContent = ph?.toFixed(2) || '--';
    const phPercent = Math.min(Math.max(((ph - 0) / 14) * 100, 0), 100);
    document.getElementById('phGauge').style.width = `${phPercent}%`;

    // Temperatura
    document.getElementById('tempValue').textContent = temp?.toFixed(1) || '--';
    const tempPercent = Math.min(Math.max(((temp - 0) / 50) * 100, 0), 100);
    document.getElementById('tempGauge').style.width = `${tempPercent}%`;

    // Luz
    document.getElementById('luxValue').textContent = lux?.toFixed(0) || '--';
    const luxPercent = Math.min(Math.max((lux / 1000) * 100, 0), 100);
    document.getElementById('luxGauge').style.width = `${luxPercent}%`;
}

// Actualizar gráficas
function actualizarGraficas() {
    const phX = sensorData.ph.map(d => d.x);
    const phY = sensorData.ph.map(d => d.y);
    const tempX = sensorData.temp.map(d => d.x);
    const tempY = sensorData.temp.map(d => d.y);
    const luxX = sensorData.lux.map(d => d.x);
    const luxY = sensorData.lux.map(d => d.y);

    Plotly.extendPlot('phChart', { x: [phX], y: [phY] }, 1);
    Plotly.extendPlot('tempChart', { x: [tempX], y: [tempY] }, 1);
    Plotly.extendPlot('luxChart', { x: [luxX], y: [luxY] }, 1);
}

// Actualizar estado de conexión
function actualizarEstadoConexion(conectado) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    statusDot.className = 'status-dot' + (conectado ? ' connected' : ' disconnected');
    statusText.textContent = conectado ? 'Conectado' : 'Desconectado';
}

// Actualizar estado de actuadores
function actualizarEstadoActuadores(nuevoEstado) {
    if (!nuevoEstado) return;

    const nuevosActuadores = {
        valvula: nuevoEstado.valvula || false,
        resistencia: nuevoEstado.resistencia || false,
        led: nuevoEstado.led || false
    };

    // Actualizar solo si cambió
    if (nuevosActuadores.valvula !== actuadores.valvula) {
        actuadores.valvula = nuevosActuadores.valvula;
        actualizarToggle('valvula', actuadores.valvula);
    }
    if (nuevosActuadores.resistencia !== actuadores.resistencia) {
        actuadores.resistencia = nuevosActuadores.resistencia;
        actualizarToggle('resistencia', actuadores.resistencia);
    }
    if (nuevosActuadores.led !== actuadores.led) {
        actuadores.led = nuevosActuadores.led;
        actualizarToggle('led', actuadores.led);
    }
}

// Actualizar toggle visualmente
function actualizarToggle(nombre, estado) {
    const toggle = document.getElementById(`${nombre}Toggle`);
    const status = document.getElementById(`${nombre}Status`);

    if (toggle) {
        toggle.checked = estado;
    }

    if (status) {
        if (estado) {
            status.classList.add('active');
            status.querySelector('.status-label').textContent = 'Encendido';
        } else {
            status.classList.remove('active');
            status.querySelector('.status-label').textContent = 'Apagado';
        }
    }
}

// Configurar eventos de toggles
function configurarEventos() {
    ['valvula', 'resistencia', 'led'].forEach(nombre => {
        const toggle = document.getElementById(`${nombre}Toggle`);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const accion = e.target.checked ? 'on' : 'off';
                enviarComandoRelay(nombre, accion);
            });
        }
    });

    // Botón de actualizar historial
    document.getElementById('refreshHistory').addEventListener('click', cargarHistorial);
}

// Enviar comando a relé
async function enviarComandoRelay(nombre, accion) {
    try {
        const response = await fetch(`${API_BASE}/${nombre}/${accion}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        if (data.ok) {
            console.log(`✅ ${nombre} ${accion === 'on' ? 'encendido' : 'apagado'}`);
            actualizarToggle(nombre, accion === 'on');
        } else {
            console.error(`❌ Error al controlar ${nombre}:`, data);
            // Revertir toggle
            const toggle = document.getElementById(`${nombre}Toggle`);
            if (toggle) toggle.checked = !toggle.checked;
        }
    } catch (error) {
        console.error(`❌ Error de conexión al controlar ${nombre}:`, error);
        const toggle = document.getElementById(`${nombre}Toggle`);
        if (toggle) toggle.checked = !toggle.checked;
    }
}

// Cargar historial
async function cargarHistorial() {
    const tbody = document.getElementById('historyBody');
    
    try {
        const response = await fetch(`${API_BASE}/historial?limite=50`);
        const datos = await response.json();

        if (datos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">No hay datos disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = datos.slice(0, 20).map(dato => {
            const fecha = new Date(dato.timestamp);
            const fechaFormateada = fecha.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const actuadoresEstado = [];
            if (dato.estado?.valvula) actuadoresEstado.push('Váĺługa ON');
            if (dato.estado?.resistencia) actuadoresEstado.push('Resistencia ON');
            if (dato.estado?.led) actuadoresEstado.push('LED ON');

            return `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td>${dato.sensores?.ph?.toFixed(2) || '--'}</td>
                    <td>${dato.sensores?.temp?.toFixed(1) || '--'}</td>
                    <td>${dato.sensores?.lux?.toFixed(0) || '--'}</td>
                    <td>${actuadoresEstado.length > 0 ? actuadoresEstado.join(', ') : 'Todos OFF'}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('❌ Error al cargar historial:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Error al cargar historial</td></tr>';
    }
}
