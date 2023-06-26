import { AfterViewInit, ApplicationRef, Component, Injector, OnDestroy, TemplateRef, ViewChild, ViewContainerRef, Input } from '@angular/core';
import {
  TemplatePortal,
  DomPortalOutlet,
} from '@angular/cdk/portal';
import { changeXPos, changeYPos } from '../state/eyetracking/eyetracking.action';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.state';
import { WebgazerService } from '../services/webgazer.service';


@Component({
  selector: 'dual-screen',
  templateUrl: './dual-screen.component.html',
  styleUrls: ['./dual-screen.component.css'],
})
export class DualScreenComponent implements AfterViewInit, OnDestroy {
  @ViewChild('templatePortalContent') templatePortalContent!: TemplateRef<unknown>;
  @Input() immediateLoad : boolean = false; //if false, component where dualScreen is used must call openSecondWindow()
  private templatePortal!: TemplatePortal<any>;
  private secondWindow : any;
  public mainWindow : any;
  private styleSheetElement: any;

  constructor(
    private _viewContainerRef: ViewContainerRef,
    private injector: Injector,
    private applicationRef: ApplicationRef,
    private store : Store<AppState>,
    private webgazerService : WebgazerService){}


  ngAfterViewInit(){
    if(this.immediateLoad){
      this.openSecondWindow();
    }
  }

  public closeSecondWindow(){
    this.secondWindow.close()
  }

  //get second window without re-opening it
  public getSecondWindow(){
    return this.secondWindow;
  }

  public focusSecondWindow(){
    this.secondWindow.focus();
  }

  public getActiveScreen() : "main" | "second"{ 
    if(this.secondWindow.document.hasFocus()){
      return "second";
    }
    else{
      return "main";
    }
  }

  public focusMainWindow(){
    this.mainWindow.focus();
  }

  public startWebgazer(webgazer : any){
    let store = this.store;
    const secondWindow = this.secondWindow;
    const webgazerService = this.webgazerService;
    webgazer.setGazeListener(function(data : any) {
        let active = secondWindow.document.hasFocus(); 
        if (data == null ||  !active) { //main screen active => don't track here
          webgazerService.resumeWebgazer();
          return;
        }
        //store current x and y pos
        webgazerService.pauseWebgazer();
        store.dispatch(changeXPos({newx: data.x}));
        store.dispatch(changeYPos({newy: data.y}));
        console.log("dispatched from second window");
    }).begin()
  }

  public openSecondWindow() : Promise<Window>{
    return new Promise(resolve => {
      this.secondWindow = window.open('assets/secondscreen.html', 'SECOND_SCREEN', 'width=600,height=400,left=200,top=200');
      setTimeout(() => {
        console.log("second window loaded", this.secondWindow)
        this.attachContent();
        this.attachStyles();
        const webgazer = this.secondWindow.webgazer; 
        this.startWebgazer(webgazer);
        this.secondWindow.opener.name = "parent";
        this.mainWindow = window.open('', 'parent');
        resolve(this.secondWindow);
      }, 2000)
    })     
  }

  private attachContent(){
    this.secondWindow.document.title = 'Second Screen';
    this.templatePortal = new TemplatePortal(this.templatePortalContent, this._viewContainerRef);
    const outlet = new DomPortalOutlet(this.secondWindow.document.body, undefined, this.applicationRef, this.injector);
    outlet.attach(this.templatePortal);
  }

  private attachStyles(){
    // Copy styles from parent window
    document.querySelectorAll('style').forEach(htmlElement => {
      this.secondWindow.document.head.appendChild(htmlElement.cloneNode(true));
    });
    // Copy stylesheet link from parent window
    this.styleSheetElement = this.getStyleSheetElement();
    this.secondWindow.document.head.appendChild(this.styleSheetElement);
  }

  //source: https://stackblitz.com/edit/portal-simple?file=src%2Fapp%2Fapp.component.ts
  private getStyleSheetElement() {
    const styleSheetElement = document.createElement('link');
    document.querySelectorAll('link').forEach(htmlElement => {
      if (htmlElement.rel === 'stylesheet') {
        const absoluteUrl = new URL(htmlElement.href).href;
        styleSheetElement.rel = 'stylesheet';
        styleSheetElement.href = absoluteUrl;
      }
    });
    return styleSheetElement;
  }

  ngOnDestroy(){
    //default text when no content is displayed on second screen during the next component
    this.secondWindow.document.getElementById("content").innerText = "Check the main screen for further instructions."
  }

}

