import { addIcons } from 'ionicons';
import { personAddOutline, trashOutline, createOutline, personOutline,searchOutline,callOutline, personCircleOutline } from 'ionicons/icons';

export function registerAppIcons() {
  addIcons({
    'person-add-outline': personAddOutline,
    'trash-outline': trashOutline,
    'create-outline': createOutline,
    'person-outline': personOutline,
    'search-outline': searchOutline,
    'call-outline': callOutline,
    'person-circle-outline': personCircleOutline
  });
}
