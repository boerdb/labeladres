import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonButton, IonIcon, IonButtons, IonBackButton, IonList, IonText, ToastController } from '@ionic/angular/standalone';
import { PersonenService, Persoon } from '../services/personen';
import { PrinterService } from '../services/printer';
import { getBatteryColor, getBatteryIconName } from '../utils/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardContent, IonItem, IonLabel,
    IonInput, IonSelect, IonSelectOption, IonButton, IonButtons, IonIcon
  ],
})
export class HomePage implements OnInit {

  private personenService = inject(PersonenService);
  private router = inject(Router); // Nodig om terug te navigeren
  private printerService = inject(PrinterService);
  private toastController = inject(ToastController);

  huidigPersoon: Persoon = this.getEmptyPersoon();
  autoReconnectBezig = false;

  ngOnInit(): void {
    void this.probeerAutoReconnect();
  }

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

    this.personenService.savePersoon(this.huidigPersoon).subscribe(async () => {
      await this.toonToast('Persoon opgeslagen.');
      this.router.navigate(['/lijst']);
    });
  }

  cancel() {
    this.router.navigate(['/lijst']);
  }

  get printerNaam(): string | null {
    return this.printerService.connectedDeviceNameSignal();
  }

  get batterijNiveau(): number | null {
    return this.printerService.batteryLevelSignal();
  }

  get batterijIconNaam(): string {
    return getBatteryIconName(this.batterijNiveau);
  }

  get batterijKleur(): string {
    return getBatteryColor(this.batterijNiveau);
  }

  get batterijLabel(): string {
    return this.batterijNiveau === null ? 'onbekend' : `${this.batterijNiveau}%`;
  }

  private async probeerAutoReconnect(): Promise<void> {
    if (!this.printerService.hasSavedPrinter() || this.printerService.getConnectedDeviceName()) {
      return;
    }

    this.autoReconnectBezig = true;
    try {
      await this.printerService.autoReconnectSaved();
    } finally {
      this.autoReconnectBezig = false;
    }
  }

  private async toonToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'bottom',
    });
    await toast.present();
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
