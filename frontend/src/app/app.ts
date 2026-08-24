import { Component, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { createIcons, CreditCard, Landmark, CheckCircle, XCircle, Clock, Shuffle, BarChart2, Zap, Send, List, Shield, Layout, Settings, Activity, Database, Server } from 'lucide';
import { SidebarComponent } from './components/sidebar/sidebar';
import { OverviewComponent } from './components/overview/overview';
import { LabComponent } from './components/lab/lab';
import { BankSimulatorComponent } from './components/bank-simulator/bank-simulator';
import { TimelineComponent } from './components/timeline/timeline';
import { PaymentStateService } from './services/payment-state';

const ICONS = {
  CreditCard,
  Landmark,
  CheckCircle,
  XCircle,
  Clock,
  Shuffle,
  BarChart2,
  Zap,
  Send,
  List,
  Shield,
  Layout,
  Settings,
  Activity,
  Database,
  Server
};

const PAGE_COPY: Record<string, { title: string; subtitle: string; badge: string }> = {
  overview: {
    title: 'Idempotency control center',
    subtitle: 'Track request flow, duplicate suppression, and the final outcome of every payment.',
    badge: 'Overview'
  },
  lab: {
    title: 'Concurrent request lab',
    subtitle: 'Stress-test the payment path with repeated requests that share a single idempotency key.',
    badge: 'Lab'
  },
  bank: {
    title: 'Bank response simulator',
    subtitle: 'Switch the provider between success, failure, and timeout to watch the workflow adapt.',
    badge: 'Simulator'
  },
  timeline: {
    title: 'Event timeline',
    subtitle: 'Review a condensed feed of operational events as the demo evolves.',
    badge: 'Timeline'
  }
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    UpperCasePipe,
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

  get pageCopy() {
    return PAGE_COPY[this.state.activeTab()] ?? PAGE_COPY['overview'];
  }

  ngAfterViewChecked() {
    createIcons({
      icons: ICONS
    });
  }

  ngOnDestroy() {
    // The service handles cleanup if needed, though it's provided in root
  }
}
