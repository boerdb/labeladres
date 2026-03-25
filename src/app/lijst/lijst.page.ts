import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router,RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonButton, IonIcon,
  IonList, IonText, IonButtons, IonSearchbar
} from '@ionic/angular/standalone';
import { PersonenService, Persoon } from '../services/personen';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-lijst',
  templateUrl: './lijst.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
   IonCardContent, IonItem, IonLabel,RouterModule,
    IonButton, IonIcon, IonList, IonText, IonButtons, IonSearchbar,CommonModule
  ]
})
export class LijstPage {
  // Gebruik van de moderne inject() functie
  private personenService = inject(PersonenService);
  private router = inject(Router);
  public authService = inject(AuthService);

  allePersonen: Persoon[] = [];      // De ruwe data uit MariaDB
  gefilterdePersonen: Persoon[] = []; // De lijst die de zoekbalk gebruikt
  zoekTerm: string = '';

  // Deze methode zorgt dat de lijst ververst zodra je op de pagina komt
  ionViewWillEnter() {
    this.loadPersonen();
  }

  loadPersonen() {
    this.personenService.getPersonen().subscribe(data => {
      this.allePersonen = data;
      this.filterLijst();
    });
  }

  // De zoekfunctie die live filtert
  filterLijst() {
    const term = this.zoekTerm.toLowerCase().trim();

    if (!term) {
      this.gefilterdePersonen = [...this.allePersonen];
      return;
    }

    this.gefilterdePersonen = this.allePersonen.filter(p => {
      return p.voornaam.toLowerCase().includes(term) ||
             p.achternaam.toLowerCase().includes(term) ||
             p.woonplaats.toLowerCase().includes(term) ||
             p.straat.toLowerCase().includes(term);
    });
  }

  // Navigeer naar het formulier voor een nieuwe invoer
  nieuwPersoon() {
    this.personenService.persoonOmTeBewerken = null;
    this.router.navigate(['/home']);
  }

  // Navigeer naar het formulier om een bestaand persoon te bewerken
  editPersoon(p: Persoon) {
    this.personenService.persoonOmTeBewerken = { ...p };
    this.router.navigate(['/home']);
  }

  // Verwijder-functie met de veilige waarschuwing
  deletePersoon(id: number | undefined) {
    if (!id) return;
    if (confirm('Weet je zeker dat je deze persoon wilt wissen?')) {
      this.personenService.deletePersoon(id).subscribe(() => {
        this.loadPersonen();
      });
    }
  }
}
