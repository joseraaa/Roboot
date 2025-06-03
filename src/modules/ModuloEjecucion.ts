import { Trayectoria } from '../models/Trayectoria';
import { Coordenadas } from '../models/Coordenadas';

/**
 * Clase ModuloEjecucion - Gestiona la ejecución de trayectorias
 */
export class ModuloEjecucion {
  private trayectoriaActual: Trayectoria | null;
  private enEjecucion: boolean;
  private velocidad: number; // milisegundos entre puntos
  private callbackActualizacion: ((coordenadas: Coordenadas) => void) | null;

  constructor() {
    this.trayectoriaActual = null;
    this.enEjecucion = false;
    this.velocidad = 1000; // 1 segundo por defecto
    this.callbackActualizacion = null;
  }

  /**
   * Importa una trayectoria desde un string y mueve el robot a la posición inicial
   * @param datos String con los datos de la trayectoria
   * @param formato Formato de los datos ('CSV' o 'JSON')
   * @param callbackPosicionInicial Función para mover el robot a la posición inicial
   * @returns true si la importación fue exitosa
   */
  importarTrayectoria(
    datos: string, 
    formato: 'CSV' | 'JSON',
    callbackPosicionInicial?: (coordenadas: Coordenadas) => void
  ): boolean {
    const nuevaTrayectoria = new Trayectoria(formato);
    if (nuevaTrayectoria.importarDatos(datos)) {
      this.trayectoriaActual = nuevaTrayectoria;
      
      // Mover el robot a la primera posición si hay un callback
      if (callbackPosicionInicial) {
        const primerPunto = this.obtenerPrimerPunto();
        if (primerPunto) {
          callbackPosicionInicial(primerPunto);
        }
      }
      
      return true;
    }
    return false;
  }

  /**
   * Obtiene el primer punto de la trayectoria sin avanzar el índice
   */
  private obtenerPrimerPunto(): Coordenadas | null {
    if (this.trayectoriaActual) {
      this.trayectoriaActual.reiniciar();
      const primerPunto = this.trayectoriaActual.obtenerSiguientePunto();
      this.trayectoriaActual.reiniciar();
      return primerPunto;
    }
    return null;
  }

  /**
   * Inicia la ejecución de la trayectoria actual
   * @param callback Función a llamar con cada actualización de coordenadas
   * @returns true si se inició la ejecución
   */
  iniciarEjecucion(callback: (coordenadas: Coordenadas) => void): boolean {
    if (!this.trayectoriaActual || this.enEjecucion) {
      return false;
    }

    this.callbackActualizacion = callback;
    this.enEjecucion = true;
    this.trayectoriaActual.reiniciar();
    this.ejecutarSiguientePunto();
    return true;
  }

  /**
   * Ejecuta el siguiente punto de la trayectoria
   */
  private ejecutarSiguientePunto(): void {
    if (!this.enEjecucion || !this.trayectoriaActual || !this.callbackActualizacion) {
      return;
    }

    const siguientePunto = this.trayectoriaActual.obtenerSiguientePunto();
    if (siguientePunto) {
      this.callbackActualizacion(siguientePunto);
      setTimeout(() => this.ejecutarSiguientePunto(), this.velocidad);
    } else {
      this.detenerEjecucion();
    }
  }

  /**
   * Detiene la ejecución de la trayectoria
   */
  detenerEjecucion(): void {
    this.enEjecucion = false;
    this.callbackActualizacion = null;
  }

  /**
   * Establece la velocidad de ejecución
   * @param milisegundos Tiempo entre puntos en milisegundos
   */
  setVelocidad(milisegundos: number): void {
    this.velocidad = Math.max(100, Math.min(5000, milisegundos));
  }

  /**
   * Obtiene el progreso actual de la ejecución
   */
  get progreso(): number {
    return this.trayectoriaActual?.progreso ?? 0;
  }

  /**
   * Verifica si hay una trayectoria cargada
   */
  get tieneTrayectoria(): boolean {
    return this.trayectoriaActual !== null;
  }

  /**
   * Verifica si la ejecución está en curso
   */
  get estaEjecutando(): boolean {
    return this.enEjecucion;
  }
}