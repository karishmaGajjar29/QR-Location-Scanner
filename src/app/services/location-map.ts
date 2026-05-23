import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationMapService {

  getLocationFromQr(value: string): string | null {
    if (!value) return null;

    const qrValue = value.trim();

    // Format: 21.1702,72.8311
    const latLngPattern = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

    if (latLngPattern.test(qrValue)) {
      return qrValue.replace(/\s/g, '');
    }

    // Google Maps URL
    if (qrValue.includes('google.com/maps')) {
      return qrValue;
    }

    return null;
  }

  buildGoogleMapDirectionUrl(destination: string): string {
    if (destination.includes('google.com/maps')) {
      return destination;
    }

    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  openGoogleMapDirection(destination: string): void {
    const url = this.buildGoogleMapDirectionUrl(destination);
    window.open(url, '_blank');
  }
}