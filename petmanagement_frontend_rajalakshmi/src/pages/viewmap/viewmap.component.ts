import { Component, AfterViewInit, Input } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-viewmap',
  standalone: true,
  imports: [],
  templateUrl: './viewmap.component.html',
  styleUrl: './viewmap.component.scss'
})
export class ViewmapComponent {

  @Input() latitude: any;  // Default location (Bangalore)
  @Input() longitude: any;
  private map!: L.Map;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 500); // Delay ensures component is fully rendered
  }

  private initMap(): void {
    if (this.map) {
      this.map.off(); // Remove event listeners
      this.map.remove();
    }
    const customIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41]
    });
    const container:any = L.DomUtil.get('map');
    if (container != null) {
      container._leaflet_id = null;
    }
    this.map = L.map('map').setView([this.latitude, this.longitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add a marker
    L.marker([this.latitude, this.longitude], { icon: customIcon }).addTo(this.map)
      .bindPopup('Selected Location')
      .openPopup();
  }


}
