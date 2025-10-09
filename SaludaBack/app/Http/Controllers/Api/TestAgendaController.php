<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CitaMejorada;
use App\Models\Especialista;
use App\Models\PacienteMejorado;
use App\Models\SucursalMejorada;
use App\Models\ConsultorioMejorado;
use App\Models\Especialidad;
use Illuminate\Support\Facades\DB;

class TestAgendaController extends Controller
{
    public function test()
    {
        return response()->json([
            'status' => 'success',
            'message' => 'TestAgendaController funcionando correctamente',
            'timestamp' => now()->toISOString()
        ]);
    }

    public function testCors()
    {
        return response()->json([
            'status' => 'success',
            'message' => 'CORS funcionando correctamente',
            'timestamp' => now()->toISOString()
        ]);
    }

    public function getCitas(Request $request)
    {
        try {
            // Usar el modelo CitaMejorada con relaciones
            $query = CitaMejorada::with(['paciente', 'especialista', 'sucursal']);

            // Filtro por fecha
            if ($request->filled('fecha')) {
                $fechaFiltro = date('Y-m-d', strtotime($request->fecha));
                $query->whereDate('Fecha_Cita', '=', $fechaFiltro);
            }

            // Filtro por especialista
            if ($request->filled('especialista')) {
                $query->where('Fk_Especialista', $request->especialista);
            }

            // Filtro por sucursal
            if ($request->filled('sucursal')) {
                $query->where('Fk_Sucursal', $request->sucursal);
            }

            // Filtro por estado
            if ($request->filled('estado')) {
                $query->where('Estado_Cita', $request->estado);
            }

            // Filtro por especialidad
            if ($request->filled('especialidad')) {
                $query->whereHas('especialista', function($q) use ($request) {
                    $q->where('Fk_Especialidad', $request->especialidad);
                });
            }

            // Filtro por nombre del paciente (BÚSQUEDA)
            if ($request->filled('busqueda')) {
                $query->whereHas('paciente', function($q) use ($request) {
                    $q->where('Nombre', 'LIKE', '%' . $request->busqueda . '%')
                      ->orWhere('Apellido', 'LIKE', '%' . $request->busqueda . '%')
                      ->orWhereRaw("CONCAT(Nombre, ' ', Apellido) LIKE ?", ['%' . $request->busqueda . '%']);
                });
            }

            // Ordenar por fecha y hora de la cita
            $query->orderBy('Fecha_Cita', 'DESC')
                  ->orderBy('Hora_Inicio', 'ASC');

            // Paginación
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            $citas = $query->paginate($perPage, ['*'], 'page', $page);

            // Transformar los datos para que coincidan con la estructura esperada por el frontend
            $citasTransformadas = $citas->getCollection()->map(function($cita) {
                return [
                    'Cita_ID' => $cita->Cita_ID,
                    'Fecha_Cita' => $cita->Fecha_Cita,
                    'Hora_Inicio' => $cita->Hora_Inicio,
                    'Hora_Fin' => $cita->Hora_Fin,
                    'Estado_Cita' => $cita->Estado_Cita,
                    'Tipo_Cita' => $cita->Tipo_Cita,
                    'Observaciones' => $cita->Observaciones,
                    'Fk_Paciente' => $cita->Fk_Paciente,
                    'Fk_Especialista' => $cita->Fk_Especialista,
                    'Fk_Sucursal' => $cita->Fk_Sucursal,
                    'Fk_Horario' => $cita->Fk_Horario,
                    'paciente' => $cita->paciente ? [
                        'Paciente_ID' => $cita->paciente->Paciente_ID,
                        'Nombre' => $cita->paciente->Nombre,
                        'Apellido' => $cita->paciente->Apellido,
                        'Telefono' => $cita->paciente->Telefono,
                        'Email' => $cita->paciente->Email,
                        'Fecha_Nacimiento' => $cita->paciente->Fecha_Nacimiento,
                        'Genero' => $cita->paciente->Genero
                    ] : null,
                    'especialista' => $cita->especialista ? [
                        'Especialista_ID' => $cita->especialista->Especialista_ID,
                        'Nombre_Completo' => $cita->especialista->Nombre_Completo,
                        'Especialidad' => $cita->especialista->Especialidad,
                        'Telefono' => $cita->especialista->Telefono,
                        'Email' => $cita->especialista->Email
                    ] : null,
                    'sucursal' => $cita->sucursal ? [
                        'Sucursal_ID' => $cita->sucursal->Sucursal_ID,
                        'Nombre_Sucursal' => $cita->sucursal->Nombre_Sucursal,
                        'Direccion' => $cita->sucursal->Direccion,
                        'Telefono' => $cita->sucursal->Telefono
                    ] : null
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $citasTransformadas,
                'total' => $citas->total(),
                'current_page' => $citas->currentPage(),
                'last_page' => $citas->lastPage(),
                'per_page' => $citas->perPage(),
                'from' => $citas->firstItem(),
                'to' => $citas->lastItem(),
                'message' => 'Citas obtenidas exitosamente'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener citas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener citas: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function getEspecialistas()
    {
        try {
            $especialistas = DB::table('especialistas')->get();

            return response()->json([
                'status' => 'success',
                'data' => $especialistas,
                'count' => $especialistas->count(),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener especialistas: ' . $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    public function getPacientes()
    {
        try {
            $pacientes = DB::table('pacientes_mejorados')->get();

            return response()->json([
                'status' => 'success',
                'data' => $pacientes,
                'count' => $pacientes->count(),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener pacientes: ' . $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    public function getSucursales()
    {
        try {
            // Usar el modelo Eloquent en lugar de consultas directas
            $sucursales = \App\Models\SucursalMejorada::select([
                'Sucursal_ID',
                'Nombre_Sucursal',
                'Direccion',
                'Telefono',
                'Email',
                'Activa',
                'ID_H_O_D'
            ])
            ->where('Activa', true) // Solo sucursales activas
            ->orderBy('Nombre_Sucursal')
            ->get();

            return response()->json([
                'status' => 'success',
                'data' => $sucursales,
                'count' => $sucursales->count(),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener sucursales', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener sucursales: ' . $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    public function getConsultorios()
    {
        try {
            // Usar el modelo Eloquent en lugar de consultas directas
            $consultorios = \App\Models\ConsultorioMejorado::select([
                'Consultorio_ID',
                'Nombre_Consultorio',
                'Descripcion',
                'Capacidad',
                'Fk_Sucursal',
                'Estado',
                'ID_H_O_D'
            ])
            ->where('Estado', 'Activo') // Solo consultorios activos
            ->orderBy('Nombre_Consultorio')
            ->get();

            return response()->json([
                'status' => 'success',
                'data' => $consultorios,
                'count' => $consultorios->count(),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener consultorios', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener consultorios: ' . $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }
}
