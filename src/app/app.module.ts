import { NgModule } from '@angular/core';
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

import { ClickComponent } from './click/click.component';
import { HoverComponent } from './hover/hover.component';
import { ScrollComponent } from './scroll/scroll.component';
import { BaseTasksComponent } from './base-tasks/base-tasks.component';
import { PopupPointerLockStopComponent } from './popup-pointer-lock-stop/popup-pointer-lock-stop.component';
import { HeaderComponent } from './header/header.component';




@NgModule({
  declarations: [
    AppComponent,
    ClickComponent,
    HoverComponent,
    ScrollComponent,
    PopupPointerLockStopComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    StoreModule.forRoot({
      eyetrackingData : eyetrackingReducer,
      expConditionsData : expConditionsReducer
    }),
    BrowserAnimationsModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
