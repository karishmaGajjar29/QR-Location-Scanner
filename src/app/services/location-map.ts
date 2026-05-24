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

  /**
   * Parses scanned QR code content into location details.
   * Supports:
   * 1. Raw coordinates "lat,lng" (e.g. "23.0225,72.5714")
   * 2. Google Maps URL with coordinate query and label/description
   *    e.g. https://www.google.com/maps?q=23.0225,72.5714(Ahmedabad)&desc=My+Description
   * 3. Google Maps URL with direct address query
   *    e.g. https://www.google.com/maps?q=Subh+residency%2C+Ahmedabad
   */
  parseLocationDetails(value: string): { name: string; lat: number; lng: number; description: string } | null {
    if (!value) return null;
    const trimmed = value.trim();

    // 1. Check if it's a raw coordinate pair: "lat,lng"
    const latLngRegex = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;
    const rawMatch = trimmed.match(latLngRegex);
    if (rawMatch) {
      return {
        name: 'Scanned Location',
        lat: parseFloat(rawMatch[1]),
        lng: parseFloat(rawMatch[2]),
        description: ''
      };
    }

    // 2. Check if it's a Google Maps URL
    if (trimmed.includes('google.com/maps')) {
      let lat = 0;
      let lng = 0;
      let name = 'Scanned Location';
      let description = '';

      try {
        const urlObj = new URL(trimmed);
        const qParam = urlObj.searchParams.get('q') || urlObj.searchParams.get('query');
        const descParam = urlObj.searchParams.get('desc');

        if (descParam) {
          description = descParam;
        }

        if (qParam) {
          // Parse coordinates and label: e.g. 23.0225,72.5714(Ahmedabad)
          const coordLabelRegex = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\(([^)]+)\))?$/;
          const match = qParam.match(coordLabelRegex);
          if (match) {
            lat = parseFloat(match[1]);
            lng = parseFloat(match[2]);
            if (match[3]) {
              name = decodeURIComponent(match[3]);
            }
          } else {
            // It's a text-based address search
            name = decodeURIComponent(qParam);
            lat = 0;
            lng = 0;
          }
        }
        
        if (lat !== 0 || lng !== 0 || name !== 'Scanned Location') {
          return { name, lat, lng, description };
        }
      } catch (e) {
        console.warn('URL parsing failed, trying manual regex parsing', e);
      }

      // Regex fallback: find lat,lng in the URL text
      const fallbackRegex = /([?&]q(?:uery)?=)?(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\(([^)]+)\))?/;
      const match = trimmed.match(fallbackRegex);
      if (match) {
        lat = parseFloat(match[2]);
        lng = parseFloat(match[3]);
        if (match[4]) {
          name = decodeURIComponent(match[4]);
        }
        
        // Find desc query parameter manually
        const descMatch = trimmed.match(/[?&]desc=([^&]+)/);
        if (descMatch) {
          description = decodeURIComponent(descMatch[1].replace(/\+/g, ' '));
        }

        return { name, lat, lng, description };
      } else {
        // Fallback for address query in URL: find the q query parameter manually
        const qMatch = trimmed.match(/[?&](?:q|query)=([^&]+)/);
        if (qMatch) {
          name = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
          
          // If we have an embedded name in parentheses at the end, parse it, else use full string
          const labelMatch = name.match(/^(.*)\(([^)]+)\)$/);
          if (labelMatch) {
            name = labelMatch[2]; // Use the label name
          }
          
          const descMatch = trimmed.match(/[?&]desc=([^&]+)/);
          if (descMatch) {
            description = decodeURIComponent(descMatch[1].replace(/\+/g, ' '));
          }
          return { name, lat: 0, lng: 0, description };
        }
      }
    }

    return null;
  }

  /**
   * Builds the custom Google Maps URL that contains coordinates, custom label, and optional description.
   * Format: https://www.google.com/maps?q=lat,lng(Name)&desc=Description
   */
  buildCustomMapsUrl(lat: number, lng: number, name: string, description: string): string {
    const encodedName = name ? `(${encodeURIComponent(name.trim())})` : '';
    let url = `https://www.google.com/maps?q=${lat},${lng}${encodedName}`;
    if (description) {
      url += `&desc=${encodeURIComponent(description.trim())}`;
    }
    return url;
  }

  /**
   * Builds a text address search URL for Google Maps.
   * Format: https://www.google.com/maps?q=Address+Name&desc=Description
   */
  buildAddressMapsUrl(address: string, description: string): string {
    let url = `https://www.google.com/maps?q=${encodeURIComponent(address.trim())}`;
    if (description) {
      url += `&desc=${encodeURIComponent(description.trim())}`;
    }
    return url;
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