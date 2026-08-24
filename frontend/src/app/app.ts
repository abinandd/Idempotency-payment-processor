import { Component, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createIcons, CreditCard, Landmark, CheckCircle, XCircle, Clock, Shuffle, BarChart2, Zap, Send, List, Shield, Layout, Settings, Activity, Database, Server } from 'lucide';
import { SidebarComponent } from './components/sidebar/sidebar';
import { OverviewComponent } from './components/overview/overview';
import { LabComponent } from './components/lab/lab';
import { BankSimulatorComponent } from './components/bank-simulator/bank-simulator';
import { TimelineComponent } from './components/timeline/timeline';
import { PaymentStateService } from './services/payment-state';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarComponent, 
    OverviewComponent, 
    LabComponent, 
    BankSimulatorComponent, 
    TimelineComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements AfterViewChecked, OnDestroy {

  constructor(public state: PaymentStateService) {}

  ngAfterViewChecked() {
    createIcons({
      icons: {
        CreditCard, Landmark, CheckCircle, XCircle, Clock, Shuffle, BarChart2, Zap, Send, List, Shield, Layout, Settings, Activity, Database, Server
      }
    });
  }

  ngOnDestroy() {
    // The service handles cleanup if needed, though it's provided in root
  }
}
