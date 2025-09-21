// Espera a que todo el HTML esté cargado para ejecutar el código
document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES Y ELEMENTOS DEL DOM ---
    const formEstudiante = document.getElementById('formEstudiante');
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnExportar = document.getElementById('btnExportar');
    let estudiantes = JSON.parse(localStorage.getItem('calificacionesDB')) || [];
    
    // --- ELEMENTOS DEL DOM PARA LA VISTA ESTUDIANTE ---
    const btnBuscarNotas = document.getElementById('btnBuscarNotas');
    const inputArchivo = document.getElementById('archivoCalificaciones');
    const inputIdBusqueda = document.getElementById('estudianteIDBusqueda');
    const divResultado = document.getElementById('resultadoEstudiante');
    let miGrafico = null; // Variable para almacenar la instancia del gráfico

    // --- FUNCIONES DE LA VISTA DOCENTE ---
    function renderizarTabla() {
        cuerpoTabla.innerHTML = '';
        estudiantes.forEach((est, index) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${est.nombre}</td>
                <td>${est.id}</td>
                <td><input type="number" class="nota-deberes" value="${est.notas.deberes || ''}" data-index="${index}" min="0" max="10" step="0.1"></td>
                <td><input type="number" class="nota-tareas" value="${est.notas.tareas || ''}" data-index="${index}" min="0" max="10" step="0.1"></td>
                <td><input type="number" class="nota-trabajos" value="${est.notas.trabajos || ''}" data-index="${index}" min="0" max="10" step="0.1"></td>
                <td><input type="number" class="nota-trimestral" value="${est.notas.trimestral || ''}" data-index="${index}" min="0" max="10" step="0.1"></td>
                <td><button class="btn-eliminar" data-index="${index}">Eliminar</button></td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    function guardarDatos() {
        document.querySelectorAll('#cuerpoTabla tr').forEach((fila, index) => {
            if (estudiantes[index]) {
                estudiantes[index].notas.deberes = fila.querySelector('.nota-deberes').value;
                estudiantes[index].notas.tareas = fila.querySelector('.nota-tareas').value;
                estudiantes[index].notas.trabajos = fila.querySelector('.nota-trabajos').value;
                estudiantes[index].notas.trimestral = fila.querySelector('.nota-trimestral').value;
            }
        });
        localStorage.setItem('calificacionesDB', JSON.stringify(estudiantes));
        alert('¡Datos guardados localmente!');
    }

    // --- MANEJO DE EVENTOS DE LA VISTA DOCENTE ---
    formEstudiante.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombreEstudiante').value.trim();
        const id = document.getElementById('idEstudiante').value.trim();
        if (!nombre || !id) {
            alert('El nombre y el ID no pueden estar vacíos.');
            return;
        }
        if (estudiantes.some(est => est.id === id)) {
            alert('Error: Ya existe un estudiante con ese número de carnet.');
            return;
        }
        estudiantes.push({ nombre: nombre, id: id, notas: {} });
        formEstudiante.reset();
        renderizarTabla();
        guardarDatos();
    });
    
    cuerpoTabla.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-eliminar')) {
            const index = e.target.getAttribute('data-index');
            if (confirm(`¿Estás seguro de que quieres eliminar a ${estudiantes[index].nombre}?`)) {
                estudiantes.splice(index, 1);
                renderizarTabla();
                guardarDatos();
            }
        }
    });

    btnGuardar.addEventListener('click', guardarDatos);
    
    btnExportar.addEventListener('click', () => {
        guardarDatos();
        if (estudiantes.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(estudiantes, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "calificaciones.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert("Archivo JSON generado.");
    });

    // --- LÓGICA DE LA VISTA DEL ESTUDIANTE ---
    btnBuscarNotas.addEventListener('click', () => {
        const archivo = inputArchivo.files[0];
        const idBuscado = inputIdBusqueda.value.trim();
        if (!archivo || idBuscado === "") {
            alert('Por favor, carga el archivo y escribe tu número de carnet.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(evento) {
            try {
                const calificaciones = JSON.parse(evento.target.result);
                const estudianteEncontrado = calificaciones.find(est => est.id === idBuscado);
                if (estudianteEncontrado) {
                    mostrarNotasEstudiante(estudianteEncontrado);
                } else {
                    divResultado.innerHTML = `<p style="color: red; font-weight: bold;">No se encontraron calificaciones para el ID proporcionado.</p>`;
                    if(miGrafico) miGrafico.destroy(); // Limpia el gráfico si no se encuentra al estudiante
                }
            } catch (e) {
                alert('Error al leer el archivo. Asegúrate de que sea el archivo .json correcto.');
            }
        };
        reader.readAsText(archivo);
    });

    // Función para mostrar las notas y el gráfico del estudiante
    function mostrarNotasEstudiante(estudiante) {
        divResultado.innerHTML = `
            <h3>Hola, ${estudiante.nombre}</h3>
            <p>Aquí está el resumen de tus calificaciones:</p>
            <ul>
                <li><strong>Deberes:</strong> ${estudiante.notas.deberes || 'N/A'}</li>
                <li><strong>Tareas:</strong> ${estudiante.notas.tareas || 'N/A'}</li>
                <li><strong>Trabajos:</strong> ${estudiante.notas.trabajos || 'N/A'}</li>
                <li style="font-weight: bold;"><strong>Nota Trimestral:</strong> ${estudiante.notas.trimestral || 'N/A'}</li>
            </ul>
            <canvas id="graficoNotas"></canvas>
        `;

        const ctx = document.getElementById('graficoNotas').getContext('2d');
        const etiquetas = ['Deberes', 'Tareas', 'Trabajos', 'Trimestral'];
        const datosNotas = [
            parseFloat(estudiante.notas.deberes) || 0,
            parseFloat(estudiante.notas.tareas) || 0,
            parseFloat(estudiante.notas.trabajos) || 0,
            parseFloat(estudiante.notas.trimestral) || 0
        ];

        if (miGrafico) {
            miGrafico.destroy();
        }

        miGrafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Calificaciones',
                    data: datosNotas,
                    backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)'],
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, max: 10 } },
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Rendimiento Académico' }
                }
            }
        });
    }

    // --- INICIALIZACIÓN ---
    renderizarTabla();
});

// Función global para cambiar entre vistas
function cambiarVista(vistaId) {
    document.querySelectorAll('.vista').forEach(vista => vista.classList.remove('vista-activa'));
    document.getElementById(vistaId).classList.add('vista-activa');
    if (vistaId === 'vistaDocente') {
        document.getElementById('vistaDocente').classList.add('vista-activa');
    }
}