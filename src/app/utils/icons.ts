import { addIcons } from 'ionicons';
import {
  personAddOutline,
  trashOutline,
  createOutline,
  personOutline,
  searchOutline,
  callOutline,
  personCircleOutline,
  bluetoothOutline,
  printOutline,
  batteryDeadOutline,
  batteryHalfOutline,
  batteryFullOutline,
} from 'ionicons/icons';

export function registerAppIcons() {
  addIcons({
    'person-add-outline': personAddOutline,
    'trash-outline': trashOutline,
    'create-outline': createOutline,
    'person-outline': personOutline,
    'search-outline': searchOutline,
    'call-outline': callOutline,
    'person-circle-outline': personCircleOutline,
    'bluetooth-outline': bluetoothOutline,
    'print-outline': printOutline,
    'battery-dead-outline': batteryDeadOutline,
    'battery-half-outline': batteryHalfOutline,
    'battery-full-outline': batteryFullOutline,
  });
}

export function getBatteryIconName(level: number | null): string {
  if (level === null) {
    return 'battery-half-outline';
  }

  if (level <= 20) {
    return 'battery-dead-outline';
  }

  if (level <= 60) {
    return 'battery-half-outline';
  }

  return 'battery-full-outline';
}

export function getBatteryColor(level: number | null): string {
  if (level === null) {
    return 'var(--ion-color-medium)';
  }

  if (level <= 20) {
    return 'var(--ion-color-danger)';
  }

  if (level <= 60) {
    return 'var(--ion-color-warning)';
  }

  return 'var(--ion-color-success)';
}
