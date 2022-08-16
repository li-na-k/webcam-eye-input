import { Component, OnDestroy, OnInit } from '@angular/core';
import { EyesOnlyInputService } from 'src/services/eyes-only-input.service';

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.css']
})
export class ScrollComponent implements OnInit, OnDestroy {

  public interval : any;

  constructor(private eyesOnlyInput : EyesOnlyInputService) { }

  ngOnInit(): void {

    var scrollAreas = document.getElementsByClassName("scroll-area");
    var inside : boolean = false;
    this.interval = setInterval(() => {
      for(var i = 0; i < scrollAreas.length; i++){
        var el : HTMLElement = scrollAreas[i] as HTMLElement;
    
        if(el){
          inside = this.eyesOnlyInput.checkIfInsideElement(el);
        }
        if (inside == true && el){
          if(el.classList.contains("bottom")){
            window.scrollBy(0, 10);
          }
          if(el.classList.contains("top")){
            window.scrollBy(0, -10);
          }
          if(el.classList.contains("left")){
            window.scrollBy(-10, 0);
          }
          if(el.classList.contains("right")){
            window.scrollBy(10, 0);
          }
        }
      }
    }, 100)

  }

  ngOnDestroy(): void {
    clearInterval(this.interval)
  } 
}



    

