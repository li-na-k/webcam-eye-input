import { Component, OnDestroy, OnInit } from '@angular/core';
import { Timer } from 'd3';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';

@Component({
  selector: 'app-click',
  templateUrl: './click.component.html',
  styleUrls: ['./click.component.css']
})
export class ClickComponent implements OnInit, OnDestroy {

  public interval : any;

  constructor(private eyesOnlyInput : EyesOnlyInputService) { }



  ngOnInit(): void {
    var el = document.getElementById("rect");
    const dwellTime = 1000;
    var wentInsideAt : number|null = null; 
    var inside : boolean = false;
    this.interval = setInterval(() => {
      if(el){
        inside = this.eyesOnlyInput.checkIfInsideElement(el);
      }
      if (inside == true && el){
        if (!wentInsideAt) {
          wentInsideAt = Date.now()
        }
        else if (wentInsideAt + dwellTime < Date.now()) {
          el.style.backgroundColor = "var(--apricot)";
        }
      }
      else if(inside == false && el){
        wentInsideAt = null;
        el.style.backgroundColor = "var(--blue)";
      }
    }, 100);
  }

  ngOnDestroy(): void {
      clearInterval(this.interval)
  }





}
