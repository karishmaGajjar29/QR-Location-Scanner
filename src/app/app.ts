import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { QrLocationScannerComponent } from './components/qr-location-scanner/qr-location-scanner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatToolbarModule,
    QrLocationScannerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'qr-location-scanner';
}