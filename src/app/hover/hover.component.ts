import { Component, OnDestroy, OnInit } from '@angular/core';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';

@Component({
  selector: 'app-hover',
  templateUrl: './hover.component.html',
  styleUrls: ['./hover.component.css']
})
export class HoverComponent implements OnInit, OnDestroy {

  public interval : any;

  constructor(private eyesOnlyInput : EyesOnlyInputService) { }

  ngOnInit(): void {

    var el = document.getElementById("rect");
    var inside : boolean | undefined = false;

    this.interval = setInterval(() => {
      if(el){
        console.log("inside interval: ");
        console.log(el?.getBoundingClientRect())
        inside = this.eyesOnlyInput.checkIfInsideElement(el);
      }
      if (inside == true && el){
        el.style.backgroundColor = "var(--apricot)";
      }
      else if(inside == false && el){
        el.style.backgroundColor = "var(--blue)";
      }
    }, 100);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval)
}

}
