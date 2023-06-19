import { AfterViewInit, ApplicationRef, Component, ComponentFactoryResolver, Injector, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef, ElementRef } from '@angular/core';
import {
  TemplatePortal,
  DomPortalOutlet,
} from '@angular/cdk/portal';


@Component({
  selector: 'dual-screen',
  templateUrl: './dual-screen.component.html',
  styleUrls: ['./dual-screen.component.css'],
})
export class DualScreenComponent {
  @ViewChild('templatePortalContent') templatePortalContent!: TemplateRef<unknown>;

  templatePortal!: TemplatePortal<any>;

  private externalWindow : any;
  styleSheetElement: any;

  constructor(
    private _viewContainerRef: ViewContainerRef,
    private injector: Injector,
    private componentFactoryResolver: ComponentFactoryResolver,
    private applicationRef: ApplicationRef){}


  openSecondWindow() : Promise<Window>{
    return new Promise(resolve => {
      this.externalWindow = window.open('assets/secondscreen.html', 'SECOND_SCREEN', 'width=600,height=400,left=200,top=200');
      // Wait for window instance to be created
      this.externalWindow.onload = () => {
        this.externalWindow.document.body.innerText = '';
        this.externalWindow.document.title = 'Second Screen';
        this.templatePortal = new TemplatePortal(this.templatePortalContent, this._viewContainerRef);
        const outlet = new DomPortalOutlet(this.externalWindow.document.body, this.componentFactoryResolver, this.applicationRef, this.injector);
        outlet.attach(this.templatePortal);
    
        // Copy styles from parent window
        document.querySelectorAll('style').forEach(htmlElement => {
          this.externalWindow.document.head.appendChild(htmlElement.cloneNode(true));
        });
        // Copy stylesheet link from parent window
        this.styleSheetElement = this.getStyleSheetElement();
        this.externalWindow.document.head.appendChild(this.styleSheetElement);  

        resolve(this.externalWindow);
      }
    })     
  }

  //source: https://stackblitz.com/edit/portal-simple?file=src%2Fapp%2Fapp.component.ts
  getStyleSheetElement() {
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
    this.externalWindow.close()
  }

}
