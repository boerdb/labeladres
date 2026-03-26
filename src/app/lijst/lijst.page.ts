import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardContent, IonItem, IonLabel, IonButton, IonIcon,
  IonList, IonText, IonButtons, IonSearchbar, IonSpinner, IonCheckbox, ToastController
} from '@ionic/angular/standalone';
import { PersonenService, Persoon } from '../services/personen';
import { AuthService } from '../services/auth.service';
import { PrinterService } from '../services/printer';
import { AddressLabelRendererService } from '../services/address-label-renderer.service';
import { getBatteryColor, getBatteryIconName } from '../utils/icons';

@Component({
  selector: 'app-lijst',
  templateUrl: './lijst.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent, IonItem, IonLabel, RouterModule,
    IonButton, IonIcon, IonList, IonText, IonButtons, IonSearchbar, IonSpinner, IonCheckbox
  ]
})
export class LijstPage {
  private readonly batchPrintPauzeMs = 900;
  // Gebruik van de moderne inject() functie
  private personenService = inject(PersonenService);
  private router = inject(Router);
  public printerService = inject(PrinterService);
  private labelRenderer = inject(AddressLabelRendererService);
  private toastController = inject(ToastController);
  public authService = inject(AuthService);

  allePersonen: Persoon[] = [];      // De ruwe data uit MariaDB
  gefilterdePersonen: Persoon[] = []; // De lijst die de zoekbalk gebruikt
  zoekTerm = '';
  printerNaam: string | null = null;
  koppelenBezig = false;
  printenBezigId: number | string | null = null;
  batchPrintBezig = false;
  batchPrintTotaal = 0;
  batchPrintIndex = 0;
  private geselecteerdeSleutels = new Set<number | string>();

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
        this.geselecteerdeSleutels.delete(id);
        this.loadPersonen();
      });
    }
  }

  refreshPrinterStatus() {
    this.printerNaam = this.printerService.getConnectedDeviceName();
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
      const printerVerbonden = await this.ensurePrinterConnected();
      if (!printerVerbonden) {
        return;
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

  isGeselecteerd(p: Persoon): boolean {
    return this.geselecteerdeSleutels.has(this.getPersoonKey(p));
  }

  wijzigSelectie(p: Persoon, geselecteerd: boolean) {
    const key = this.getPersoonKey(p);
    if (geselecteerd) {
      this.geselecteerdeSleutels.add(key);
      return;
    }

    this.geselecteerdeSleutels.delete(key);
  }

  toggleAlleGefilterdeSelectie() {
    const allesGeselecteerd = this.zijnAlleGefilterdePersonenGeselecteerd();

    for (const persoon of this.gefilterdePersonen) {
      const key = this.getPersoonKey(persoon);
      if (allesGeselecteerd) {
        this.geselecteerdeSleutels.delete(key);
      } else {
        this.geselecteerdeSleutels.add(key);
      }
    }
  }

  zijnAlleGefilterdePersonenGeselecteerd(): boolean {
    return this.gefilterdePersonen.length > 0 && this.gefilterdePersonen.every((persoon) => this.isGeselecteerd(persoon));
  }

  heeftSelectie(): boolean {
    return this.geselecteerdeSleutels.size > 0;
  }

  aantalSelecties(): number {
    return this.geselecteerdeSleutels.size;
  }

  async printGeselecteerden() {
    const geselecteerdePersonen = this.allePersonen.filter((persoon) => this.geselecteerdeSleutels.has(this.getPersoonKey(persoon)));

    if (!geselecteerdePersonen.length) {
      await this.toonToast('Selecteer eerst een of meer adressen.');
      return;
    }

    this.batchPrintBezig = true;
    this.batchPrintTotaal = geselecteerdePersonen.length;
    this.batchPrintIndex = 0;

    try {
      const printerVerbonden = await this.ensurePrinterConnected();
      if (!printerVerbonden) {
        return;
      }

      for (const persoon of geselecteerdePersonen) {
        this.batchPrintIndex += 1;
        this.printenBezigId = this.getPersoonKey(persoon);

        const canvas = this.labelRenderer.renderPersoon(persoon);
        await this.printerService.print(canvas);

        if (this.batchPrintIndex < geselecteerdePersonen.length) {
          await this.wacht(this.batchPrintPauzeMs);
        }
      }

      this.geselecteerdeSleutels.clear();
      await this.toonToast(`${geselecteerdePersonen.length} adreslabels verzonden.`);
    } catch (error) {
      const naam = this.getPersoonNaamOpKey(this.printenBezigId);
      await this.toonToast(`Batch gestopt bij ${naam}: ${this.errorMessage(error)}`);
    } finally {
      this.batchPrintBezig = false;
      this.batchPrintTotaal = 0;
      this.batchPrintIndex = 0;
      this.printenBezigId = null;
      this.refreshPrinterStatus();
    }
  }

  private getPersoonKey(p: Persoon): number | string {
    return p.id ?? `${p.voornaam}-${p.achternaam}-${p.postcode}`;
  }

  private getPersoonNaamOpKey(key: number | string | null): string {
    if (key === null) {
      return 'onbekend adres';
    }

    const persoon = this.allePersonen.find((item) => this.getPersoonKey(item) === key);
    if (!persoon) {
      return 'onbekend adres';
    }

    return `${persoon.voornaam} ${persoon.achternaam}`.trim() || 'onbekend adres';
  }

  private async ensurePrinterConnected(): Promise<boolean> {
    if (this.printerService.getConnectedDeviceName()) {
      return true;
    }

    await this.koppelPrinter();
    return Boolean(this.printerService.getConnectedDeviceName());
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

  private wacht(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}
