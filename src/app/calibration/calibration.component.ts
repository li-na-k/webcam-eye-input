import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.css']
})
export class CalibrationComponent{
  @ViewChild('dualscreen') dualscreen! : any;

  constructor(protected socketService : SocketService) { 
  }

  calibrationDone = false;

  startCalibration(){
    this.socketService.startCalibration();
  }

  @Output() calibrationDoneEvent = new EventEmitter<boolean>();
}

