import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice?: MediaDeviceInfo;

  allowedFormats = [
    BarcodeFormat.QR_CODE
  ];

  constructor(
    private locationMapService: LocationMapService,
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

    const location = this.locationMapService.getLocationFromQr(result);

    if (!location) {
      this.snackBar.open('Invalid location QR code', 'Close', {
        duration: 3000
      });
      return;
    }

    this.destination = location;

    this.snackBar.open('Location scanned successfully', 'Close', {
      duration: 2000
    });

    this.openDirection();
  }

  openDirection(): void {
    if (!this.destination) return;

    this.locationMapService.openGoogleMapDirection(this.destination);
  }

  scanAgain(): void {
    this.scannedValue = '';
    this.destination = '';
    this.scannerEnabled = true;
  }
}