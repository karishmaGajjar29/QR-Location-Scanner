import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { LocationMapService } from '../../services/location-map';

@Component({
  selector: 'app-qr-location-scanner',
  standalone: true,
  imports: [
    CommonModule,
    ZXingScannerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './qr-location-scanner.html',
  styleUrl: './qr-location-scanner.css'
})
export class QrLocationScannerComponent {

  scannerEnabled = true;
  scannedValue = '';
  destination = '';
  errorMessage = '';
  hasPermission?: boolean;

  // New variables for storing parsed QR details and map iframe security
  parsedLocation: { name: string; lat: number; lng: number; description: string } | null = null;
  mapPreviewUrl: SafeResourceUrl | null = null;

  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice?: MediaDeviceInfo;

  allowedFormats = [
    BarcodeFormat.QR_CODE
  ];

  constructor(
    private locationMapService: LocationMapService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {}

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.errorMessage = '';
    this.availableDevices = devices;

    if (devices.length === 0) {
      this.onCamerasNotFound();
      return;
    }

    const backCamera = devices.find(device =>
      /back|rear|environment/i.test(device.label)
    );

    this.selectedDevice = backCamera || devices[0];
  }

  onCamerasNotFound(): void {
    this.errorMessage = 'No camera found. Please connect a camera or test on a mobile device.';
    this.snackBar.open(this.errorMessage, 'Close', {
      duration: 4000
    });
  }

  onPermissionResponse(permission: boolean): void {
    this.hasPermission = permission;
    if (!permission) {
      this.errorMessage = 'Camera permission denied. Please allow camera access in your browser settings to scan QR codes.';
      this.snackBar.open(this.errorMessage, 'Close', {
        duration: 4000
      });
    } else {
      this.errorMessage = '';
    }
  }

  onScanError(error: any): void {
    console.error('Scanner error:', error);
    const errMsg = error?.message || String(error);
    if (errMsg.includes('Requested device not found') || errMsg.includes('NotFoundError')) {
      this.errorMessage = 'Requested camera device not found. Please verify your camera is connected and active.';
    } else if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
      this.errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
    } else {
      this.errorMessage = `Camera initialization error: ${errMsg}`;
    }
  }

  retryScanner(): void {
    this.errorMessage = '';
    this.scannerEnabled = false;
    setTimeout(() => {
      this.scannerEnabled = true;
    }, 100);
  }

  onScanSuccess(result: string): void {
    this.scannedValue = result;
    this.scannerEnabled = false;

    // Try to parse detailed custom URL format first
    const details = this.locationMapService.parseLocationDetails(result);

    if (!details) {
      // Fallback to basic location scanning if URL format doesn't match custom specs
      const location = this.locationMapService.getLocationFromQr(result);
      if (!location) {
        this.snackBar.open('No valid Google Maps location found in QR code.', 'Close', {
          duration: 3500
        });
        return;
      }
      this.destination = location;
      this.snackBar.open('Basic Location scanned successfully', 'Close', {
        duration: 2000
      });
      this.openDirection();
      return;
    }

    // Set detailed parsed state
    this.parsedLocation = details;
    this.destination = this.locationMapService.buildGoogleMapDirectionUrl(result);

    // Sanitize embed map iframe preview URL: check if we have coordinates, otherwise use address name
    let rawMapUrl = '';
    if (details.lat !== 0 || details.lng !== 0) {
      rawMapUrl = `https://maps.google.com/maps?q=${details.lat},${details.lng}&z=15&output=embed`;
    } else {
      rawMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(details.name)}&z=15&output=embed`;
    }
    this.mapPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawMapUrl);

    this.snackBar.open('Location details parsed successfully!', 'Close', {
      duration: 2000
    });
  }

  openDirection(): void {
    if (!this.destination) return;
    this.locationMapService.openGoogleMapDirection(this.destination);
  }

  copyLink(): void {
    if (!this.scannedValue) return;
    navigator.clipboard.writeText(this.scannedValue)
      .then(() => {
        this.snackBar.open('Scanned Maps link copied!', 'Close', {
          duration: 2000
        });
      })
      .catch(err => {
        console.error('Copy error:', err);
        this.snackBar.open('Failed to copy link.', 'Close', {
          duration: 2000
        });
      });
  }

  scanAgain(): void {
    this.scannedValue = '';
    this.destination = '';
    this.parsedLocation = null;
    this.mapPreviewUrl = null;
    this.scannerEnabled = true;
  }
}