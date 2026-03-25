import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonButton, IonIcon, IonButtons, IonBackButton, IonList, IonText } from '@ionic/angular/standalone';
import { PersonenService, Persoon } from '../services/personen';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardContent, IonItem, IonLabel,
    IonInput, IonSelect, IonSelectOption, IonButton, IonButtons
  ],
})
export class HomePage {

  private personenService = inject(PersonenService);
  private router = inject(Router); // Nodig om terug te navigeren

  huidigPersoon: Persoon = this.getEmptyPersoon();

  // Als de pagina laadt, checken we of we iemand moeten bewerken
  ionViewWillEnter() {
    if (this.personenService.persoonOmTeBewerken) {
      this.huidigPersoon = this.personenService.persoonOmTeBewerken;
    } else {
      this.huidigPersoon = this.getEmptyPersoon();
    }
  }

  savePersoon() {
    if (!this.huidigPersoon.voornaam || !this.huidigPersoon.achternaam) {
      alert('Vul minimaal een voor- en achternaam in!');
      return;
    }

    this.personenService.savePersoon(this.huidigPersoon).subscribe(() => {
      // Na succesvol opslaan, springen we direct terug naar de lijst!
      this.router.navigate(['/lijst']);
    });
  }

  cancel() {
    this.router.navigate(['/lijst']);
  }

  getEmptyPersoon(): Persoon {
    return {
  geslacht: 'Anders',
  voornaam: '',
  achternaam: '',
  straat: '',
  huisnummer: '',
  postcode: '',
  woonplaats: '',
  telefoon: ''
};
  }
}
