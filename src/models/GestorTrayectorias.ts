import { PuntoTrayectoria } from './PuntoTrayectoria';
import { Articulacion } from './Articulacion';

export class GestorTrayectorias {
  private puntos: PuntoTrayectoria[];
  private enEjecucion: boolean;
  private indiceActual: number;
  private velocidad: number; // milisegundos entre puntos

  constructor() {
    this.puntos = [];
    this.enEjecucion = false;
    this.indiceActual = 0;
    this.velocidad = 1000; // 1 segundo por defecto
  }

  agregarPunto(articulaciones: Articulacion[]): void {
    this.puntos.push(new PuntoTrayectoria(articulaciones));
  }

  limpiarTrayectoria(): void {
    this.puntos = [];
    this.indiceActual = 0;
    this.enEjecucion = false;
  }

  async ejecutarTrayectoria(
    callback: (articulaciones: Articulacion[]) => void
  ): Promise<void> {
    if (this.puntos.length < 2 || this.enEjecucion) {
      return;
    }

    this.enEjecucion = true;
    this.indiceActual = 0;

    while (this.enEjecucion && this.indiceActual < this.puntos.length) {
      const punto = this.puntos[this.indiceActual];
      callback(punto.articulaciones);
      
      await new Promise(resolve => setTimeout(resolve, this.velocidad));
      this.indiceActual++;
    }

    this.enEjecucion = false;
  }

  detenerEjecucion(): void {
    this.enEjecucion = false;
  }

  setVelocidad(milisegundos: number): void {
    this.velocidad = Math.max(100, Math.min(5000, milisegundos));
  }

  exportarTrayectoria(): string {
    return JSON.stringify(this.puntos, null, 2);
  }

  importarTrayectoria(json: string): boolean {
    try {
      const datos = JSON.parse(json);
      if (Array.isArray(datos)) {
        this.puntos = datos.map(punto => PuntoTrayectoria.fromJSON(punto));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al importar trayectoria:', error);
      return false;
    }
  }

  get cantidadPuntos(): number {
    return this.puntos.length;
  }

  get estaEjecutando(): boolean {
    return this.enEjecucion;
  }
}