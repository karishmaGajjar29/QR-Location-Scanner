import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Material Design Modules for high-quality UI components
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Service to handle Google Maps URL generation
import { LocationMapService } from '../../services/location-map';

// Import the QR Code generation library
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-location-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './qr-location-generator.html',
  styleUrl: './qr-location-generator.css'
})
export class QrLocationGeneratorComponent {
  // Form input bindings
  locationName: string = '';
  latitude: number | null = null;
  longitude: number | null = null;
  description: string = '';

  // Output generator state
  generatedUrl: string = '';
  qrCodeDataUrl: string = '';
  mapPreviewUrl: SafeResourceUrl | null = null;
  isGenerated: boolean = false;
  isLoadingCoords: boolean = false;

  constructor(
    private locationMapService: LocationMapService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Queries OpenStreetMap Nominatim Geocoding API to resolve coordinates for the Location Name.
   */
  searchLocationCoordinates(): void {
    if (!this.locationName || !this.locationName.trim()) {
      this.showToast('Please enter a Location Name to search.');
      return;
    }

    this.isLoadingCoords = true;
    this.showToast('Searching for location coordinates...');

    // Nominatim geocoding URL (requires User-Agent header)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.locationName.trim())}&format=json&limit=1`;

    fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PinPoint-QR-Code-Location-Scanner'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response error');
        }
        return response.json();
      })
      .then(data => {
        this.isLoadingCoords = false;
        if (data && data.length > 0) {
          const place = data[0];
          this.latitude = parseFloat(place.lat);
          this.longitude = parseFloat(place.lon);
          this.showToast(`Coordinates found: ${this.latitude}, ${this.longitude}`);
          
          // Auto generate QR code and preview map since coordinates are populated
          this.generateQrCode();
        } else {
          this.showToast('Could not find coordinates for this location. Please enter them manually.');
        }
      })
      .catch(err => {
        console.error('Geocoding search error:', err);
        this.isLoadingCoords = false;
        this.showToast('Search service unavailable. Please enter coordinates manually.');
      });
  }

  /**
   * Validates input values and generates the Google Maps link and QR code.
   */
  generateQrCode(): void {
    // 1. Basic validation check: Address/Location name is always required
    if (!this.locationName || !this.locationName.trim()) {
      this.showToast('Please enter an Address or Location Name.');
      return;
    }

    const hasCoords = this.latitude !== null && this.longitude !== null;

    // 2. If coordinates are provided, validate ranges
    if (this.latitude !== null && (this.latitude < -90 || this.latitude > 90)) {
      this.showToast('Latitude must be between -90 and 90 degrees.');
      return;
    }

    if (this.longitude !== null && (this.longitude < -180 || this.longitude > 180)) {
      this.showToast('Longitude must be between -180 and 180 degrees.');
      return;
    }

    try {
      let rawMapUrl = '';
      
      // 3. Construct the URL based on coordinate availability
      if (hasCoords) {
        // Coordinate-based map URL
        this.generatedUrl = this.locationMapService.buildCustomMapsUrl(
          this.latitude!,
          this.longitude!,
          this.locationName,
          this.description
        );
        rawMapUrl = `https://maps.google.com/maps?q=${this.latitude},${this.longitude}&z=15&output=embed`;
      } else {
        // Address-based map URL
        this.generatedUrl = this.locationMapService.buildAddressMapsUrl(
          this.locationName,
          this.description
        );
        rawMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(this.locationName.trim())}&z=15&output=embed`;
      }

      // 4. Generate the QR code data URL using the qrcode library
      QRCode.toDataURL(this.generatedUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e293b', // Deep slate primary color
          light: '#ffffff'
        }
      })
      .then(url => {
        this.qrCodeDataUrl = url;
        
        // 5. Generate trusted iframe map URL for the map preview
        this.mapPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawMapUrl);
        
        this.isGenerated = true;
        this.showToast(hasCoords 
          ? 'QR Code and Preview generated from coordinates!' 
          : 'QR Code and Preview generated from Address!'
        );
      })
      .catch(err => {
        console.error('QR Generation Error:', err);
        this.showToast('Failed to generate QR Code. Please try again.');
      });

    } catch (error) {
      console.error('Generation Error:', error);
      this.showToast('An unexpected error occurred during generation.');
    }
  }

  /**
   * Copies the constructed Google Maps link to the clipboard.
   */
  copyLink(): void {
    if (!this.generatedUrl) return;

    navigator.clipboard.writeText(this.generatedUrl)
      .then(() => {
        this.showToast('Google Maps link copied to clipboard!');
      })
      .catch(err => {
        console.error('Clipboard copy failed:', err);
        this.showToast('Failed to copy link. Please manually copy the URL.');
      });
  }

  /**
   * Downloads the generated QR Code image as a PNG file.
   */
  downloadQrCode(): void {
    if (!this.qrCodeDataUrl) return;

    // Create a temporary link element to trigger the browser download dialog
    const downloadLink = document.createElement('a');
    
    // Clean location name for file naming, default to "location"
    const sanitizedName = this.locationName.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'location';
    
    downloadLink.href = this.qrCodeDataUrl;
    downloadLink.download = `QR_${sanitizedName}.png`;
    
    // Append link, trigger click event, and clean up
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    this.showToast('QR Code downloaded successfully!');
  }

  /**
   * Resets the entire form and clears generated results.
   */
  clearForm(): void {
    this.locationName = '';
    this.latitude = null;
    this.longitude = null;
    this.description = '';
    this.generatedUrl = '';
    this.qrCodeDataUrl = '';
    this.mapPreviewUrl = null;
    this.isGenerated = false;
    this.showToast('Form cleared.');
  }

  /**
   * Helper to display snackbar notifications at the bottom of the screen.
   */
  private showToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
