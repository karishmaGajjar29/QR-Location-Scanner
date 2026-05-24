import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { QrLocationScannerComponent } from './components/qr-location-scanner/qr-location-scanner';
import { QrLocationGeneratorComponent } from './components/qr-location-generator/qr-location-generator';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    QrLocationScannerComponent,
    QrLocationGeneratorComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'qr-location-scanner';
}