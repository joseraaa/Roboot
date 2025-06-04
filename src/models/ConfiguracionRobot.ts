import { ParametrosCinematica } from './ParametrosCinematica';
import { Articulacion } from './Articulacion';

/**
 * Interfaz que define la estructura de la configuración del robot
 */
export interface ConfiguracionRobot {
  parametros: ParametrosCinematica;
  articulaciones: Articulacion[];
}

/**
 * Clase para gestionar la configuración del robot
 */
export class GestorConfiguracion {
  /**
   * Exporta la configuración actual a un archivo
   * @param config Configuración actual del robot
   * @returns Blob con los datos de configuración
   */
  static exportarConfiguracion(config: ConfiguracionRobot): Blob {
    const datos = JSON.stringify(config, null, 2);
    return new Blob([datos], { type: 'application/json' });
  }

  /**
   * Importa una configuración desde un archivo
   * @param contenido Contenido del archivo de configuración
   * @returns Objeto ConfiguracionRobot o null si el formato es inválido
   */
  static importarConfiguracion(contenido: string): ConfiguracionRobot | null {
    try {
      const datos = JSON.parse(contenido);
      
      // Validar la estructura del objeto
      if (!this.esConfiguracionValida(datos)) {
        return null;
      }
      
      // Recrear las instancias de Articulacion
      const articulaciones = datos.articulaciones.map(
        (a: any) => new Articulacion(a.id, a.tipo, a.valorActual, a.limiteInferior, a.limiteSuperior)
      );
      
      return {
        parametros: datos.parametros,
        articulaciones
      };
    } catch (error) {
      console.error('Error al importar configuración:', error);
      return null;
    }
  }

  /**
   * Valida que el objeto tenga la estructura correcta
   */
  private static esConfiguracionValida(datos: any): boolean {
    return (
      datos &&
      typeof datos === 'object' &&
      'parametros' in datos &&
      'articulaciones' in datos &&
      Array.isArray(datos.articulaciones) &&
      datos.articulaciones.length > 0 &&
      datos.parametros.longitudBase !== undefined &&
      datos.parametros.longitudBrazo !== undefined &&
      datos.parametros.radioBase !== undefined &&
      datos.parametros.alturaMaxima !== undefined
    );
  }
}