import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Persoon {
  id?: number;
  geslacht: string;
  voornaam: string;
  achternaam: string;
  straat: string;
  huisnummer: string;
  postcode: string;
  woonplaats: string;
  telefoon: string;

}

@Injectable({ providedIn: 'root' })
export class PersonenService {
  // Moderne injectie, precies zoals GitHub aanraadt!
  private http = inject(HttpClient);

  // Jouw eigen, wereldwijd bereikbare cloud-link:
  private apiUrl = 'https://weer.benswebradio.nl/api_personen.php';

  // Dit houdt bij wie we op dit moment willen bewerken
  public persoonOmTeBewerken: Persoon | null = null;

  getPersonen(): Observable<Persoon[]> {
    return this.http.get<Persoon[]>(this.apiUrl);
  }

  savePersoon(persoon: Persoon): Observable<any> {
    return this.http.post(this.apiUrl, persoon);
  }

  deletePersoon(id: number): Observable<any> {
    return this.http.post(this.apiUrl, { action: 'delete', id });
  }
}
