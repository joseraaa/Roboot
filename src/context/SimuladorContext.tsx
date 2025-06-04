import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Coordenadas } from '../models/Coordenadas';
import { Articulacion } from '../models/Articulacion';
import { ParametrosCinematica } from '../models/ParametrosCinematica';
import { ConfiguracionRobot, GestorConfiguracion } from '../models/ConfiguracionRobot';
import { GestorTrayectorias } from '../models/GestorTrayectorias';

interface SimuladorContextType {
  articulaciones: Articulacion[];
  coordenadas: Coordenadas;
  parametros: ParametrosCinematica;
  matrizDirecta: number[][];
  mostrarMatrices: boolean;
  mostrarCoordenadas: boolean;
  mostrarWorkspace: boolean;
  actualizarArticulacion: (id: number, valor: number) => void;
  actualizarCoordenadas: (coordenadas: Coordenadas) => void;
  toggleMatrices: () => void;
  toggleCoordenadas: () => void;
  toggleWorkspace: () => void;
  actualizarParametros: (nuevosParametros: Partial<ParametrosCinematica>) => void;
  reiniciarSimulador: () => void;
  exportarConfiguracion: () => Blob;
  importarConfiguracion: (contenido: string) => boolean;
  grabarPuntoTrayectoria: () => void;
  limpiarTrayectoria: () => void;
  ejecutarTrayectoria: () => Promise<void>;
  detenerTrayectoria: () => void;
  trayectoriaEnEjecucion: boolean;
  cantidadPuntosTrayectoria: number;
}

const parametrosIniciales: ParametrosCinematica = {
  longitudBase: 0.1,
  longitudBrazo: 0.6,
  radioBase: 0.15,
  alturaMaxima: 0.5
};

const articulacionesIniciales: Articulacion[] = [
  new Articulacion(0, 'rotacional', 0, -180, 180),
  new Articulacion(1, 'lineal', 0.1, 0.1, 0.5),
  new Articulacion(2, 'lineal', 0.1, 0.1, 0.6)
];

const SimuladorContext = createContext<SimuladorContextType | undefined>(undefined);

export const useSimulador = () => {
  const context = useContext(SimuladorContext);
  if (!context) {
    throw new Error('useSimulador debe ser usado dentro de SimuladorProvider');
  }
  return context;
};

export const SimuladorProvider = ({ children }: { children: ReactNode }) => {
  const [articulaciones, setArticulaciones] = useState<Articulacion[]>(articulacionesIniciales);
  const [parametros, setParametros] = useState<ParametrosCinematica>(parametrosIniciales);
  const [matrizDirecta, setMatrizDirecta] = useState<number[][]>([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]);
  const [coordenadas, setCoordenadas] = useState<Coordenadas>(new Coordenadas(0.1, 0, 0.1));
  const [mostrarMatrices, setMostrarMatrices] = useState(false);
  const [mostrarCoordenadas, setMostrarCoordenadas] = useState(true);
  const [mostrarWorkspace, setMostrarWorkspace] = useState(false);
  const [trayectoriaEnEjecucion, setTrayectoriaEnEjecucion] = useState(false);

  const gestorTrayectorias = React.useRef(new GestorTrayectorias());

  const actualizarArticulacion = (id: number, valor: number) => {
    setArticulaciones(prevState => {
      const nuevasArticulaciones = [...prevState];
      const articulacion = nuevasArticulaciones.find(a => a.id === id);
      if (articulacion) {
        articulacion.actualizarValor(valor);
      }
      return nuevasArticulaciones;
    });
    
    calcularCinematicaDirecta();
  };

  const actualizarCoordenadas = (nuevasCoordenadas: Coordenadas) => {
    setCoordenadas(nuevasCoordenadas);
    calcularCinematicaInversa(nuevasCoordenadas);
  };

  const calcularCinematicaDirecta = () => {
    const theta = articulaciones[0].valorActual * Math.PI / 180;
    const z = articulaciones[1].valorActual;
    const r = articulaciones[2].valorActual;
    
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    
    setCoordenadas(new Coordenadas(x, y, z));
    
    const nuevaMatriz = [
      [Math.cos(theta), -Math.sin(theta), 0, x],
      [Math.sin(theta), Math.cos(theta), 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1]
    ];
    
    setMatrizDirecta(nuevaMatriz);
  };

  const calcularCinematicaInversa = (coordenadas: Coordenadas) => {
    const { x, y, z } = coordenadas;
    
    const theta = Math.atan2(y, x) * 180 / Math.PI;
    const r = Math.sqrt(x * x + y * y);
    
    setArticulaciones(prevState => {
      const nuevasArticulaciones = [...prevState];
      nuevasArticulaciones[0].actualizarValor(theta);
      nuevasArticulaciones[1].actualizarValor(z);
      nuevasArticulaciones[2].actualizarValor(r);
      return nuevasArticulaciones;
    });
    
    const nuevaMatriz = [
      [Math.cos(theta * Math.PI / 180), -Math.sin(theta * Math.PI / 180), 0, x],
      [Math.sin(theta * Math.PI / 180), Math.cos(theta * Math.PI / 180), 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1]
    ];
    
    setMatrizDirecta(nuevaMatriz);
  };

  const toggleMatrices = () => setMostrarMatrices(!mostrarMatrices);
  const toggleCoordenadas = () => setMostrarCoordenadas(!mostrarCoordenadas);
  const toggleWorkspace = () => setMostrarWorkspace(!mostrarWorkspace);
  
  const actualizarParametros = (nuevosParametros: Partial<ParametrosCinematica>) => {
    setParametros(prevParams => ({
      ...prevParams,
      ...nuevosParametros
    }));
    calcularCinematicaDirecta();
  };
  
  const reiniciarSimulador = () => {
    setArticulaciones(articulacionesIniciales.map(a => new Articulacion(a.id, a.tipo, a.valorActual, a.limiteInferior, a.limiteSuperior)));
    setParametros({...parametrosIniciales});
    calcularCinematicaDirecta();
    gestorTrayectorias.current.limpiarTrayectoria();
  };

  const exportarConfiguracion = (): Blob => {
    const config: ConfiguracionRobot = {
      parametros,
      articulaciones
    };
    return GestorConfiguracion.exportarConfiguracion(config);
  };

  const importarConfiguracion = (contenido: string): boolean => {
    const config = GestorConfiguracion.importarConfiguracion(contenido);
    if (config) {
      setParametros(config.parametros);
      setArticulaciones(config.articulaciones);
      calcularCinematicaDirecta();
      return true;
    }
    return false;
  };

  const grabarPuntoTrayectoria = () => {
    gestorTrayectorias.current.agregarPunto(articulaciones);
  };

  const limpiarTrayectoria = () => {
    gestorTrayectorias.current.limpiarTrayectoria();
  };

  const ejecutarTrayectoria = async () => {
    if (gestorTrayectorias.current.cantidadPuntos < 2) return;
    
    setTrayectoriaEnEjecucion(true);
    await gestorTrayectorias.current.ejecutarTrayectoria((articulacionesNuevas) => {
      setArticulaciones(articulacionesNuevas);
      calcularCinematicaDirecta();
    });
    setTrayectoriaEnEjecucion(false);
  };

  const detenerTrayectoria = () => {
    gestorTrayectorias.current.detenerEjecucion();
    setTrayectoriaEnEjecucion(false);
  };

  React.useEffect(() => {
    calcularCinematicaDirecta();
  }, []);

  return (
    <SimuladorContext.Provider
      value={{
        articulaciones,
        coordenadas,
        parametros,
        matrizDirecta,
        mostrarMatrices,
        mostrarCoordenadas,
        mostrarWorkspace,
        actualizarArticulacion,
        actualizarCoordenadas,
        toggleMatrices,
        toggleCoordenadas,
        toggleWorkspace,
        actualizarParametros,
        reiniciarSimulador,
        exportarConfiguracion,
        importarConfiguracion,
        grabarPuntoTrayectoria,
        limpiarTrayectoria,
        ejecutarTrayectoria,
        detenerTrayectoria,
        trayectoriaEnEjecucion,
        cantidadPuntosTrayectoria: gestorTrayectorias.current.cantidadPuntos
      }}
    >
      {children}
    </SimuladorContext.Provider>
  );
};