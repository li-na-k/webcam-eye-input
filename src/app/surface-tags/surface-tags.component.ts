import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-surface-tags',
  templateUrl: './surface-tags.component.html',
  styleUrls: ['./surface-tags.component.css']
})
export class SurfaceTagsComponent {
  @Input() secondScreen : boolean = false;
}
