import { Coordenadas } from './Coordenadas';

/**
 * Clase Trayectoria - Representa una secuencia de puntos para el movimiento del robot
 */
export class Trayectoria {
  private puntos: Coordenadas[];
  private formato: 'CSV' | 'JSON';
  private indiceActual: number;

  /**
   * Constructor de la clase Trayectoria
   * @param formato Formato de los datos ('CSV' o 'JSON')
   */
  constructor(formato: 'CSV' | 'JSON' = 'JSON') {
    this.puntos = [];
    this.formato = formato;
    this.indiceActual = 0;
  }

  /**
   * Importa datos de trayectoria desde un string en formato CSV o JSON
   * @param datos String con los datos en formato CSV o JSON
   * @returns true si la importación fue exitosa, false en caso contrario
   */
  importarDatos(datos: string): boolean {
    try {
      if (this.formato === 'CSV') {
        return this.importarCSV(datos);
      } else {
        return this.importarJSON(datos);
      }
    } catch (error) {
      console.error('Error al importar datos:', error);
      return false;
    }
  }

  /**
   * Importa datos desde formato CSV
   * @param datos String en formato CSV
   * @returns true si la importación fue exitosa
   */
  private importarCSV(datos: string): boolean {
    const lineas = datos.trim().split('\n');
    const puntosNuevos: Coordenadas[] = [];
    
    let startIndex = 0;
    if (this.tieneEncabezadosCSV(lineas[0])) {
      startIndex = 1;
    }
    
    for (let i = startIndex; i < lineas.length; i++) {
      const punto = this.procesarLineaCSV(lineas[i]);
      if (punto) {
        puntosNuevos.push(punto);
      }
    }
    
    if (puntosNuevos.length > 0) {
      this.puntos = puntosNuevos;
      this.indiceActual = 0;
      return true;
    }
    return false;
  }

  /**
   * Verifica si una línea contiene encabezados CSV
   * @param linea Primera línea del archivo CSV
   * @returns true si contiene encabezados
   */
  private tieneEncabezadosCSV(linea: string): boolean {
    return linea.toLowerCase().includes('x') && 
           linea.toLowerCase().includes('y') && 
           linea.toLowerCase().includes('z');
  }

  /**
   * Procesa una línea de CSV y retorna un objeto Coordenadas
   * @param linea Línea del archivo CSV
   * @returns Objeto Coordenadas o null si la línea es inválida
   */
  private procesarLineaCSV(linea: string): Coordenadas | null {
    const valores = linea.split(',');
    if (valores.length >= 3) {
      const [x, y, z] = valores.map(v => parseFloat(v.trim()));
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        return new Coordenadas(x, y, z);
      }
    }
    return null;
  }

  /**
   * Importa datos desde formato JSON
   * @param datos String en formato JSON
   * @returns true si la importación fue exitosa
   */
  private importarJSON(datos: string): boolean {
    const datosJSON = JSON.parse(datos);
    
    if (Array.isArray(datosJSON)) {
      const puntosNuevos: Coordenadas[] = [];
      
      for (const punto of datosJSON) {
        if (this.esPuntoValido(punto)) {
          const { x, y, z } = punto;
          puntosNuevos.push(new Coordenadas(x, y, z));
        }
      }
      
      if (puntosNuevos.length > 0) {
        this.puntos = puntosNuevos;
        this.indiceActual = 0;
        return true;
      }
    }
    return false;
  }

  /**
   * Verifica si un objeto tiene las propiedades necesarias para ser un punto válido
   * @param punto Objeto a validar
   * @returns true si el punto es válido
   */
  private esPuntoValido(punto: any): punto is { x: number; y: number; z: number } {
    return typeof punto === 'object' &&
           'x' in punto &&
           'y' in punto &&
           'z' in punto &&
           !isNaN(parseFloat(punto.x)) &&
           !isNaN(parseFloat(punto.y)) &&
           !isNaN(parseFloat(punto.z));
  }

  /**
   * Exporta los puntos de la trayectoria al formato especificado
   * @returns String con los datos en formato CSV o JSON
   */
  exportarDatos(): string {
    if (this.formato === 'CSV') {
      return this.exportarCSV();
    } else {
      return this.exportarJSON();
    }
  }

  /**
   * Exporta los puntos en formato CSV
   * @returns String en formato CSV
   */
  private exportarCSV(): string {
    let csv = 'X,Y,Z\n';
    this.puntos.forEach(punto => {
      csv += `${punto.x.toFixed(4)},${punto.y.toFixed(4)},${punto.z.toFixed(4)}\n`;
    });
    return csv;
  }

  /**
   * Exporta los puntos en formato JSON
   * @returns String en formato JSON
   */
  private exportarJSON(): string {
    return JSON.stringify(this.puntos.map(punto => ({
      x: parseFloat(punto.x.toFixed(4)),
      y: parseFloat(punto.y.toFixed(4)),
      z: parseFloat(punto.z.toFixed(4))
    })), null, 2);
  }

  /**
   * Obtiene el siguiente punto de la trayectoria
   * @returns El siguiente punto o null si no hay más puntos
   */
  obtenerSiguientePunto(): Coordenadas | null {
    if (this.indiceActual < this.puntos.length) {
      return this.puntos[this.indiceActual++];
    }
    return null;
  }

  /**
   * Reinicia el índice de la trayectoria al principio
   */
  reiniciar(): void {
    this.indiceActual = 0;
  }

  /**
   * Agrega un nuevo punto a la trayectoria
   * @param punto Coordenadas del punto a agregar
   */
  agregarPunto(punto: Coordenadas): void {
    this.puntos.push(new Coordenadas(
      parseFloat(punto.x.toFixed(4)),
      parseFloat(punto.y.toFixed(4)),
      parseFloat(punto.z.toFixed(4))
    ));
  }

  /**
   * Elimina todos los puntos de la trayectoria
   */
  limpiar(): void {
    this.puntos = [];
    this.indiceActual = 0;
  }

  /**
   * Obtiene la cantidad de puntos en la trayectoria
   */
  get cantidadPuntos(): number {
    return this.puntos.length;
  }

  /**
   * Obtiene el progreso actual de la trayectoria
   */
  get progreso(): number {
    return this.puntos.length > 0 ? (this.indiceActual / this.puntos.length) * 100 : 0;
  }

  /**
   * Verifica si la trayectoria ha terminado
   */
  get haTerminado(): boolean {
    return this.indiceActual >= this.puntos.length;
  }
}