import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Voor de verbinding met login.php
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardContent, IonItem, IonLabel, IonInput, IonButton,
  IonButtons, IonBackButton, IonIcon
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonButton,
    IonButtons, IonBackButton, IonIcon
  ]
})
export class LoginPage {
  // Gebruik van de moderne inject() functie voor alle benodigdheden
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  user = '';
  pass = '';

  login() {
    // We maken het object klaar om naar de server te sturen
    const loginData = {
      username: this.user,
      password: this.pass
    };

    // We sturen de POST aanvraag naar je PHP script op de server
    //
    this.http.post('https://weer.benswebradio.nl/login.php', loginData)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            // De server heeft de hash in MariaDB gecontroleerd en geeft akkoord!
            this.authService.login();
            this.router.navigate(['/lijst']);
          } else {
            // De server vond geen match voor deze combinatie
            alert('Onjuiste gebruikersnaam of wachtwoord.');
          }
        },
        error: (err) => {
          console.error('Inlog fout:', err);
          alert('Kan geen verbinding maken met de server. Controleer je internet of HTTPS instellingen.');
        }
      });
    }

    // Voeg deze functie toe onder je login() functie in login.page.ts

registreer() {
  if (!this.user || !this.pass) {
    alert('Vul eerst een naam en wachtwoord in.');
    return;
  }

  const data = { username: this.user, password: this.pass };

  this.http.post('https://weer.benswebradio.nl/register.php', data)
    .subscribe((res: any) => {
      if (res.success) {
        alert('Account voor ' + this.user + ' is aangemaakt! Je kunt nu inloggen.');
      } else {
        alert('Fout: ' + res.message);
      }
    });
}
}
