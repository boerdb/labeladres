import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardContent, IonItem, IonLabel, IonButton, IonIcon,
  IonList, IonText, IonButtons, IonSearchbar, IonChip, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { PersonenService, Persoon } from '../services/personen';
import { AuthService } from '../services/auth.service';
import { PrinterService } from '../services/printer';
import { AddressLabelRendererService } from '../services/address-label-renderer.service';

@Component({
  selector: 'app-lijst',
  templateUrl: './lijst.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent, IonItem, IonLabel, RouterModule,
    IonButton, IonIcon, IonList, IonText, IonButtons, IonSearchbar, IonChip, IonSpinner
  ]
})
export class LijstPage {
  // Gebruik van de moderne inject() functie
  private personenService = inject(PersonenService);
  private router = inject(Router);
  private printerService = inject(PrinterService);
  private labelRenderer = inject(AddressLabelRendererService);
  private toastController = inject(ToastController);
  public authService = inject(AuthService);

  allePersonen: Persoon[] = [];      // De ruwe data uit MariaDB
  gefilterdePersonen: Persoon[] = []; // De lijst die de zoekbalk gebruikt
  zoekTerm = '';
  printerNaam: string | null = null;
  koppelenBezig = false;
  printenBezigId: number | string | null = null;

  // Deze methode zorgt dat de lijst ververst zodra je op de pagina komt
  async ionViewWillEnter() {
    this.loadPersonen();
    await this.printerService.autoReconnectSaved().catch(() => false);
    this.refreshPrinterStatus();
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

  refreshPrinterStatus() {
    this.printerNaam = this.printerService.getConnectedDeviceName();
  }

  async koppelPrinter() {
    this.koppelenBezig = true;
    try {
      const verbonden = await this.printerService.connect();
      this.refreshPrinterStatus();

      if (verbonden && this.printerNaam) {
        await this.toonToast(`Printer gekoppeld: ${this.printerNaam}`);
      } else {
        await this.toonToast('Geen printer gekoppeld.');
      }
    } catch (error) {
      await this.toonToast(`Koppelen mislukt: ${this.errorMessage(error)}`);
    } finally {
      this.koppelenBezig = false;
    }
  }

  async vergeetPrinter() {
    this.printerService.forgetSavedPrinter();
    this.printerNaam = null;
    await this.toonToast('Printerkoppeling verwijderd.');
  }

  async printPersoon(p: Persoon) {
    const key = this.getPersoonKey(p);
    this.printenBezigId = key;

    try {
      if (!this.printerService.getConnectedDeviceName()) {
        await this.koppelPrinter();
        if (!this.printerService.getConnectedDeviceName()) {
          return;
        }
      }

      const canvas = this.labelRenderer.renderPersoon(p);
      await this.printerService.print(canvas);
      await this.toonToast('Adreslabel verzonden.');
    } catch (error) {
      await this.toonToast(`Printen mislukt: ${this.errorMessage(error)}`);
    } finally {
      this.printenBezigId = null;
      this.refreshPrinterStatus();
    }
  }

  isPrinting(p: Persoon): boolean {
    return this.printenBezigId === this.getPersoonKey(p);
  }

  private getPersoonKey(p: Persoon): number | string {
    return p.id ?? `${p.voornaam}-${p.achternaam}-${p.postcode}`;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Onbekende fout';
  }

  private async toonToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
    });
    await toast.present();
  }
}
