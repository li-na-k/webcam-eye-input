import { InputType } from "../enums/input-type";
import { Positions } from "../enums/positions";
import { Sizes } from "../enums/sizes";
import { Tasks } from "../enums/tasks";
import { MatCardTitlePipe } from "../mat-card-title.pipe";
export class TaskResult {
    inputType : InputType | null = null;
    task : Tasks | null = null;
    size : Sizes | null = null;
    numberInBlock : number = 0; 
    startTime : number = new Date().getTime();
    endTime : number = new Date().getTime();
    duration : number = 0;
    durationPerPixel : number = 0;
    errors: number = 0;
    aborted : boolean = false;
    screenChanges : number[] = [];
    targetOnMainScreen: boolean = true;
    positionOnScreen : Positions = Positions.POS1; // 1 or 2
    posNumber : number = 0; //1 to 4
    XdistancePrevTarget : number = 0;
    YdistancePrevTarget : number = 0;

    eyeMouseDistribution? : number[]; //[eye interval duration, mouse interval duration, eye interval duration, mouse ....]
    mouseIntervalsDuration? : number;
    eyeIntervalsDuration? : number;
    intervalChanges? : number;
    
    public setDuration() { 
        this.duration = this.endTime - this.startTime;
        if(this.XdistancePrevTarget==0){ //to prevent division by 0
            this.XdistancePrevTarget = 1
        }
        this.durationPerPixel = this.duration / this.XdistancePrevTarget;
    };
    public setPosNumber() { 
        const posPipe = new MatCardTitlePipe();
        this.posNumber = parseInt(posPipe.transform(this.positionOnScreen,this.targetOnMainScreen)); 
    }
}
