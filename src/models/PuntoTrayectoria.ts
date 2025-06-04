import { Articulacion } from './Articulacion';

export class PuntoTrayectoria {
  articulaciones: Articulacion[];
  timestamp: number;

  constructor(articulaciones: Articulacion[]) {
    this.articulaciones = articulaciones.map(a => 
      new Articulacion(a.id, a.tipo, a.valorActual, a.limiteInferior, a.limiteSuperior)
    );
    this.timestamp = Date.now();
  }

  static fromJSON(json: any): PuntoTrayectoria {
    const articulaciones = json.articulaciones.map((a: any) =>
      new Articulacion(a.id, a.tipo, a.valorActual, a.limiteInferior, a.limiteSuperior)
    );
    const punto = new PuntoTrayectoria(articulaciones);
    punto.timestamp = json.timestamp;
    return punto;
  }
}