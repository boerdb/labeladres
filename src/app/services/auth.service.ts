import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // We kijken bij het opstarten direct of er een 'ja' in het geheugen staat
  public isIngelogd = localStorage.getItem('ben_ingelogd') === 'ja';

  login() {
    this.isIngelogd = true;
    localStorage.setItem('ben_ingelogd', 'ja'); // Opslaan in geheugen
  }

  logout() {
    this.isIngelogd = false;
    localStorage.removeItem('ben_ingelogd'); // Wissen uit geheugen
  }
}
