import { NgModule } from '@angular/core';
import { PendingChangesGuard } from './component-can-deactivate';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { StoreModule } from '@ngrx/store';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { eyetrackingReducer } from './state/eyetracking/eyetracking.reducer';
import { expConditionsReducer } from './state/expConditions/expconditions.reducer';

import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import { ClickComponent } from './click/click.component';
import { PopupPointerLockStopComponent } from './popup-pointer-lock-stop/popup-pointer-lock-stop.component';
import { HeaderComponent } from './header/header.component';
import { CalibrationComponent } from './calibration/calibration.component';
import { FinalPageComponent } from './final-page/final-page.component';
import { TestInputMethodsComponent } from './test-input-methods/test-input-methods.component';
import { DualScreenComponent } from './dual-screen/dual-screen.component';
import { SurfaceTagsComponent } from './surface-tags/surface-tags.component';
import { InitialExplanationComponent } from './initial-explanation/initial-explanation.component';

@NgModule({
  declarations: [
    AppComponent,
    ClickComponent,
    PopupPointerLockStopComponent,
    HeaderComponent,
    CalibrationComponent,
    FinalPageComponent,
    TestInputMethodsComponent,
    DualScreenComponent,
    SurfaceTagsComponent,
    InitialExplanationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    StoreModule.forRoot({
      eyetrackingData : eyetrackingReducer,
      expConditionsData : expConditionsReducer
    }),
    BrowserAnimationsModule,
    FormsModule
  ],
  providers: [PendingChangesGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
