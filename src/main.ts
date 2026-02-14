import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import {
  Chart,
  PieController,
  LineController,
  ArcElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
Chart.register(
  PieController,
  LineController,
  ArcElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

bootstrapApplication(AppComponent, appConfig)
  .catch((err: any) => console.error(err));
