/**
=========================================================
* SaludaReact - Agenda de Especialistas
=========================================================
*/

import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";

// Material Dashboard 2 React components
import DataTable from "examples/Tables/DataTable";
import MDAvatar from "components/MDAvatar";

// Context
import { AuthContext } from "context";

// Services
import AgendaService from "services/agenda-service";

// Components
import AgendaModalMejorado from "components/Modales/AgendaModalMejorado";
import SeleccionarHorarioModal from "components/Modales/SeleccionarHorarioModal";

// Default avatar
import defaultAvatar from "assets/images/zero.png";

export default function AgendaDeEspecialistas() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Estados principales
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renderError, setRenderError] = useState(null);
  
  // Estados para paginación simplificados
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(10);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    especialidad: '',
    especialista: '',
    sucursal: '',
  });
  
  // Estado para búsqueda
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para datos de referencia
  const [especialidades, setEspecialidades] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  
  // Estados para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  
  // Estados para el modal de selección de horarios
  const [horarioModalOpen, setHorarioModalOpen] = useState(false);
  const [especialistaSeleccionado, setEspecialistaSeleccionado] = useState(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);

  // Error boundary para capturar errores de renderizado
  if (renderError) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <MDBox textAlign="center" py={3}>
            <MDTypography variant="h6" color="error">
              Error en el componente: {renderError.message}
            </MDTypography>
            <MDButton 
              color="primary" 
              onClick={() => setRenderError(null)}
              sx={{ mt: 2 }}
            >
              Reintentar
            </MDButton>
          </MDBox>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  // Función optimizada para cargar datos
  const cargarDatos = useCallback(
    async (pagina = paginaActual, nuevosFiltros = filtros, nuevaBusqueda = busqueda) => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Cargando datos:', { pagina, filtros: nuevosFiltros, busqueda: nuevaBusqueda });
        
        // Usar el endpoint para citas mejoradas
        const response = await AgendaService.getCitasMejoradas({
          especialidad: nuevosFiltros.especialidad,
          especialista: nuevosFiltros.especialista,
          sucursal: nuevosFiltros.sucursal,
          per_page: elementosPorPagina,
          page: pagina,
          search: nuevaBusqueda, // 🔹 Filtrar por nombre del paciente
        });
        
        if (response.success) {
          const citasData = response.data || [];
          
          console.log('Datos de citas recibidos:', citasData);
          console.log('Primera cita (si existe):', citasData[0]);
          
          if (Array.isArray(citasData)) {
            setCitas(citasData);
            setTotalPaginas(response.last_page || Math.ceil((response.total || citasData.length) / elementosPorPagina));
            setPaginaActual(pagina);
          } else {
            console.error('Las citas no son un array válido:', citasData);
            setError('Formato de datos inválido');
            setCitas([]);
          }
        } else {
          console.error('Error en la respuesta del servicio:', response.message);
          setError(response.message || 'Error al cargar las citas');
          setCitas([]);
        }
      } catch (error) {
        console.error('Error al cargar citas:', error);
        setError('Error al cargar las citas: ' + error.message);
        setCitas([]);
      } finally {
        setLoading(false);
      }
    },
    [elementosPorPagina]
  );

  const cargarDatosReferencia = async () => {
    try {
      console.log('Cargando datos de referencia...');
      
      // Cargar especialidades, especialistas y sucursales usando las nuevas tablas
      const [especialidadesRes, especialistasRes, sucursalesRes] = await Promise.all([
        AgendaService.getEspecialidadesMejoradas(),
        AgendaService.getEspecialistasMejorados(),
        AgendaService.getSucursalesMejoradas()
      ]);

      console.log('Respuestas de datos de referencia:', {
        especialidades: especialidadesRes,
        especialistas: especialistasRes,
        sucursales: sucursalesRes
      });

      if (especialidadesRes.success) {
        const especialidadesData = especialidadesRes.data || [];
        if (Array.isArray(especialidadesData)) {
          setEspecialidades(especialidadesData);
        } else {
          console.error('Las especialidades no son un array válido:', especialidadesData);
          setEspecialidades([]);
        }
      } else {
        console.error('Error al cargar especialidades:', especialidadesRes.message);
        setEspecialidades([]);
      }

      if (especialistasRes.success) {
        const especialistasData = especialistasRes.data || [];
        if (Array.isArray(especialistasData)) {
          setEspecialistas(especialistasData);
        } else {
          console.error('Los especialistas no son un array válido:', especialistasData);
          setEspecialistas([]);
        }
      } else {
        console.error('Error al cargar especialistas:', especialistasRes.message);
        setEspecialistas([]);
      }

      if (sucursalesRes.success) {
        const sucursalesData = sucursalesRes.data || [];
        if (Array.isArray(sucursalesData)) {
          setSucursales(sucursalesData);
        } else {
          console.error('Las sucursales no son un array válido:', sucursalesData);
          setSucursales([]);
        }
      } else {
        console.error('Error al cargar sucursales:', sucursalesRes.message);
        setSucursales([]);
      }
    } catch (error) {
      console.error('Error al cargar datos de referencia:', error);
      // En caso de error, establecer arrays vacíos para evitar problemas
      setEspecialidades([]);
      setEspecialistas([]);
      setSucursales([]);
    }
  };

  // Cargar datos de referencia solo una vez
  useEffect(() => {
    cargarDatosReferencia();
  }, []);

  // Carga inicial
  useEffect(() => {
    cargarDatos(1, filtros, busqueda);
  }, []); // Solo se ejecuta una vez al montar el componente

  // Manejo de filtros optimizado
  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    setPaginaActual(1); // ✅ Reiniciamos página
    cargarDatos(1, nuevosFiltros, busqueda);
  };

  // Búsqueda con debounce real
  const handleBusqueda = useMemo(() => {
    let timeoutId;
    return (valor) => {
      setBusqueda(valor);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setPaginaActual(1); // ✅ Reiniciamos página al buscar
        cargarDatos(1, filtros, valor);
      }, 400);
    };
  }, [filtros, cargarDatos]);

  // Función para manejar el cambio de página
  const handlePageChange = (event, newPage) => {
    cargarDatos(newPage, filtros, busqueda);
  };

  // Función para manejar el cambio de elementos por página
  const handleRowsPerPageChange = (event) => {
    const newPerPage = parseInt(event.target.value, 10);
    setElementosPorPagina(newPerPage);
    setPaginaActual(1); // ✅ Reiniciamos página
    cargarDatos(1, filtros, busqueda);
  };

  // Procesar citas optimizado
  const citasProcesadas = useMemo(() => {
    return citas.map((cita) => ({
      ...cita,
      fechaFormateada: new Date(cita.Fecha_Cita).toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
      horaFormateada: new Date(`1970-01-01T${cita.Hora_Inicio}`).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }));
  }, [citas]);

  const handleNuevaCita = () => {
    setModalMode('create');
    setCitaSeleccionada(null);
    setModalOpen(true);
  };

  const handleEditarCita = (cita) => {
    setModalMode('edit');
    setCitaSeleccionada(cita);
    setModalOpen(true);
  };

  const handleVerCita = (cita) => {
    setModalMode('view');
    setCitaSeleccionada(cita);
    setModalOpen(true);
  };

  const handleEliminarCita = async (cita) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta cita?')) {
      try {
        // Liberar el horario antes de eliminar la cita
        if (cita.Fk_Horario) {
          // Si tenemos el ID del horario específico, usarlo
          await AgendaService.liberarHorarioPorId(cita.Fk_Horario);
        } else if (cita.Fk_Especialista && cita.Fk_Sucursal && cita.Fecha_Cita && cita.Hora_Inicio) {
          // Fallback al método anterior si no tenemos el ID del horario
          await AgendaService.liberarHorario(
            cita.Fk_Especialista,
            cita.Fk_Sucursal,
            cita.Fecha_Cita,
            cita.Hora_Inicio
          );
        }

        // Usar el nuevo endpoint para eliminar citas mejoradas
        const response = await AgendaService.deleteCitaMejorada(cita.Cita_ID);
        if (response.success) {
          cargarDatos(); // Recargar la lista
        } else {
          alert('Error al eliminar la cita: ' + response.message);
        }
      } catch (error) {
        console.error('Error al eliminar cita:', error);
        alert('Error al eliminar la cita');
      }
    }
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    cargarDatos(paginaActual); // Recargar la lista manteniendo la página actual
  };

  // Manejar selección de especialista y sucursal para abrir modal de horarios
  const handleSeleccionarHorario = () => {
    const especialista = especialistas.find(e => e.Especialista_ID === parseInt(filtros.especialista));
    const sucursal = sucursales.find(s => s.Sucursal_ID === parseInt(filtros.sucursal));
    
    if (!especialista || !sucursal) {
      alert('Debe seleccionar un especialista y una sucursal en los filtros');
      return;
    }
    
    setEspecialistaSeleccionado(especialista);
    setSucursalSeleccionada(sucursal);
    setHorarioModalOpen(true);
  };

  // Manejar horario seleccionado
  const handleHorarioSeleccionado = (horarioData) => {
    // Crear una nueva cita con el horario seleccionado
    const nuevaCita = {
      Fecha_Cita: horarioData.fecha,
      Hora_Inicio: horarioData.hora,
      Hora_Fin: horarioData.hora,
      Fk_Especialista: horarioData.especialista.Especialista_ID,
      Fk_Sucursal: horarioData.sucursal.Sucursal_ID,
      Estado_Cita: 'Pendiente',
      Tipo_Cita: 'Consulta'
    };
    
    setCitaSeleccionada(nuevaCita);
    setModalMode('create');
    setModalOpen(true);
    setHorarioModalOpen(false);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'warning';
      case 'Confirmada':
        return 'info';
      case 'En Proceso':
        return 'primary';
      case 'Completada':
        return 'success';
      case 'Cancelada':
      case 'No Asistió':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatearHora = (hora) => {
    try {
      if (!hora) return '';
      const horaStr = hora.toString();
      // Asegurar que solo tomamos los primeros 5 caracteres (HH:MM)
      return horaStr.substring(0, 5);
    } catch (error) {
      console.error('Error formateando hora:', error, hora);
      return '';
    }
  };

  const formatearFecha = (fecha) => {
    try {
      if (!fecha) return '';
      const fechaObj = new Date(fecha);
      
      // Verificar si la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        return '';
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, fecha);
      return '';
    }
  };

  // Configuración de columnas para la tabla
  const columnas = [
    { Header: "Fecha", accessor: "fecha", width: "12%" },
    { Header: "Hora", accessor: "hora", width: "8%" },
    { Header: "Paciente", accessor: "paciente", width: "20%" },
    { Header: "Teléfono", accessor: "telefono", width: "12%" },
    { Header: "Especialista", accessor: "especialista", width: "15%" },
    { Header: "Tipo Consulta", accessor: "tipo_consulta", width: "15%" },
    { Header: "Estado", accessor: "estado", width: "10%" },
    { Header: "Acciones", accessor: "acciones", width: "8%" }
  ];

  // Procesar datos para la tabla usando las nuevas estructuras
  const procesarCitasParaTabla = (citas) => {
    return citas.map(cita => {
      try {
        // Validar y sanitizar los datos del paciente
        let nombrePaciente = 'N/A';
        let telefonoPaciente = 'N/A';
        
        if (cita.paciente && typeof cita.paciente === 'object') {
          const nombre = cita.paciente.Nombre || '';
          const apellido = cita.paciente.Apellido || '';
          
          // Sanitizar nombres (remover caracteres problemáticos)
          const nombreSanitizado = nombre.toString().replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '').trim();
          const apellidoSanitizado = apellido.toString().replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '').trim();
          
          if (nombreSanitizado || apellidoSanitizado) {
            nombrePaciente = `${nombreSanitizado} ${apellidoSanitizado}`.trim();
          }
          
          // Sanitizar teléfono
          if (cita.paciente.Telefono) {
            telefonoPaciente = cita.paciente.Telefono.toString().replace(/[^\d\-\+\(\)\s]/g, '');
            if (!telefonoPaciente) telefonoPaciente = 'N/A';
          }
        }
        
        // Validar y sanitizar datos del especialista
        let nombreEspecialista = 'N/A';
        if (cita.especialista && typeof cita.especialista === 'object') {
          const nombreEsp = cita.especialista.Nombre_Completo || '';
          nombreEspecialista = nombreEsp.toString().replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '').trim() || 'N/A';
        }
        
        // Validar y sanitizar otros campos
        const fecha = formatearFecha(cita.Fecha_Cita) || 'N/A';
        const hora = formatearHora(cita.Hora_Inicio) || 'N/A';
        const tipoConsulta = (cita.Tipo_Cita || '').toString().replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '').trim() || 'N/A';
        const estado = cita.Estado_Cita || 'N/A';
        
        return {
          fecha: fecha,
          hora: hora,
          paciente: nombrePaciente,
          telefono: telefonoPaciente,
          especialista: nombreEspecialista,
          tipo_consulta: tipoConsulta,
          estado: (
            <Chip
              label={estado}
              color={getEstadoColor(estado)}
              size="small"
            />
          ),
          acciones: (
            <MDBox display="flex" gap={1}>
              <MDButton
                variant="text"
                color="info"
                size="small"
                onClick={() => handleVerCita(cita)}
              >
                <Icon>visibility</Icon>
              </MDButton>
              <MDButton
                variant="text"
                color="warning"
                size="small"
                onClick={() => handleEditarCita(cita)}
              >
                <Icon>edit</Icon>
              </MDButton>
              <MDButton
                variant="text"
                color="error"
                size="small"
                onClick={() => handleEliminarCita(cita)}
              >
                <Icon>delete</Icon>
              </MDButton>
            </MDBox>
          )
        };
      } catch (error) {
        console.error('Error procesando cita:', error, cita);
        // Retornar una fila de error para evitar que se rompa la tabla
        return {
          fecha: 'Error',
          hora: 'Error',
          paciente: 'Error en datos',
          telefono: 'N/A',
          especialista: 'Error en datos',
          tipo_consulta: 'Error',
          estado: (
            <Chip
              label="Error"
              color="error"
              size="small"
            />
          ),
          acciones: (
            <MDBox display="flex" gap={1}>
              <MDButton
                variant="text"
                color="error"
                size="small"
                disabled
              >
                <Icon>error</Icon>
              </MDButton>
            </MDBox>
          )
        };
      }
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <MDBox textAlign="center" py={3}>
            <MDTypography variant="h6" color="text">
              Cargando agenda de especialistas...
            </MDTypography>
          </MDBox>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  try {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          {/* Encabezado */}
          <MDBox mb={3}>
            <Card>
              <MDBox p={3} display="flex" alignItems="center" justifyContent="space-between">
                <MDBox display="flex" alignItems="center">
                  <MDBox mr={2}>
                    <MDAvatar
                      src={userData?.avatar_url || defaultAvatar}
                      alt={userData?.Nombre_Apellidos || "Usuario"}
                      size="lg"
                      bgColor={userData?.avatar_url ? "transparent" : "info"}
                    />
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="h4" fontWeight="medium">
                      Agenda de Especialistas
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                      Gestión de citas médicas con especialistas
                    </MDTypography>
                  </MDBox>
                </MDBox>
                <MDButton
                  variant="contained"
                  color="info"
                  startIcon={<Icon>add</Icon>}
                  onClick={handleNuevaCita}
                >
                  Nueva Cita
                </MDButton>
              </MDBox>
            </Card>
          </MDBox>

       

          {/* Filtros */}
          <MDBox mb={3}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" color="info" mb={2}>
                  🔍 Filtros de Búsqueda
                </MDTypography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Especialidad</InputLabel>
                      <Select
                        value={filtros.especialidad}
                        onChange={(e) => handleFiltroChange('especialidad', e.target.value)}
                        label="Especialidad"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {especialidades.map((esp) => (
                          <MenuItem key={esp.Especialidad_ID} value={esp.Especialidad_ID}>
                            {esp.Nombre_Especialidad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Especialista</InputLabel>
                      <Select
                        value={filtros.especialista}
                        onChange={(e) => handleFiltroChange('especialista', e.target.value)}
                        label="Especialista"
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {especialistas.map((esp) => (
                          <MenuItem key={esp.Especialista_ID} value={esp.Especialista_ID}>
                            {esp.Nombre_Completo}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Sucursal</InputLabel>
                      <Select
                        value={filtros.sucursal}
                        onChange={(e) => handleFiltroChange('sucursal', e.target.value)}
                        label="Sucursal"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {sucursales.map((suc) => (
                          <MenuItem key={suc.Sucursal_ID} value={suc.Sucursal_ID}>
                            {suc.Nombre_Sucursal}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Buscar por paciente"
                      variant="outlined"
                      value={busqueda}
                      onChange={(e) => handleBusqueda(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Icon>search</Icon>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <MDButton
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => {
                        setPaginaActual(1); // ✅ Reiniciamos página
                        cargarDatos(1, filtros, busqueda);
                      }}
                      startIcon={<Icon>search</Icon>}
                    >
                      Buscar
                    </MDButton>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <MDButton
                      variant="outlined"
                      color="info"
                      fullWidth
                      onClick={handleSeleccionarHorario}
                      startIcon={<Icon>schedule</Icon>}
                      disabled={!filtros.especialista || !filtros.sucursal}
                    >
                      Horarios Disponibles
                    </MDButton>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </MDBox>

          {/* Tabla de Citas */}
          <MDBox mb={3}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  📅 Citas Agendadas ({citas.length})
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" alignItems="center" py={4}>
                    <CircularProgress size={40} />
                    <MDTypography variant="body2" ml={2}>
                      Cargando citas...
                    </MDTypography>
                  </MDBox>
                ) : citasProcesadas.length === 0 ? (
                  <MDBox textAlign="center" py={4}>
                    <MDTypography variant="body2" color="text.secondary">
                      No se encontraron citas
                    </MDTypography>
                  </MDBox>
                ) : (
                  <DataTable
                    table={{
                      columns: columnas,
                      rows: procesarCitasParaTabla(citasProcesadas)
                    }}
                    isSorted={false}
                    entriesPerPage={elementosPorPagina}
                    showTotalEntries={true}
                    pagination={{
                      variant: "contained",
                      color: "info",
                      currentPage: paginaActual,
                      totalPages: totalPaginas,
                      onPageChange: handlePageChange,
                      onRowsPerPageChange: handleRowsPerPageChange,
                      rowsPerPageOptions: [5, 10, 15, 20, 25],
                      rowsPerPage: elementosPorPagina,
                      totalEntries: citas.length,
                      entriesStart: ((paginaActual - 1) * elementosPorPagina) + 1,
                      entriesEnd: Math.min(paginaActual * elementosPorPagina, citas.length)
                    }}
                    noEndBorder
                  />
                )}
              </MDBox>
            </Card>
          </MDBox>

          {/* Estadísticas Rápidas */}
          <MDBox mb={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <MDBox p={3} textAlign="center">
                    <MDTypography variant="h4" color="info" fontWeight="bold">
                      {citas.filter(c => c.Estado_Cita === 'Pendiente').length}
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                      Citas Pendientes
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <MDBox p={3} textAlign="center">
                    <MDTypography variant="h4" color="success" fontWeight="bold">
                      {citas.filter(c => c.Estado_Cita === 'Confirmada').length}
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                      Citas Confirmadas
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <MDBox p={3} textAlign="center">
                    <MDTypography variant="h4" color="warning" fontWeight="bold">
                      {citas.filter(c => c.Estado_Cita === 'En Proceso').length}
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                      En Proceso
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <MDBox p={3} textAlign="center">
                    <MDTypography variant="h4" color="error" fontWeight="bold">
                      {citas.filter(c => c.Estado_Cita === 'Cancelada').length}
                    </MDTypography>
                    <MDTypography variant="body2" color="text">
                      Canceladas
                    </MDTypography>
                  </MDBox>
                </Card>
              </Grid>
            </Grid>
          </MDBox>
        </MDBox>

        {/* Modal de Agenda Mejorado */}
        <AgendaModalMejorado
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          agendaData={citaSeleccionada}
          onSuccess={handleModalSuccess}
        />

        {/* Modal de Selección de Horarios */}
        <SeleccionarHorarioModal
          open={horarioModalOpen}
          onClose={() => setHorarioModalOpen(false)}
          especialista={especialistaSeleccionado}
          sucursal={sucursalSeleccionada}
          onHorarioSeleccionado={handleHorarioSeleccionado}
        />

        <Footer />
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error de renderizado en AgendaDeEspecialistas:', error);
    setRenderError(error);
    return null;
  }
}
