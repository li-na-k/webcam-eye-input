import { InputType } from "../enums/input-type";
import { Sizes } from "../enums/sizes";
import { Tasks } from "../enums/tasks";

export class TaskResult {
    inputType : InputType | null = null;
    task : Tasks | null = null;
    size : Sizes | null = null;
    startTime : number = new Date().getTime();
    endTime : number = new Date().getTime();
    duration : number = 0;
    errors: number = 0;
    aborted : boolean = false;
    screenChanges : number[] = [];
    targetOnMainScreen: boolean = true;


    eyeMouseDistribution? : number[]; //[eye interval duration, mouse interval duration, eye interval duration, mouse ....]
    mouseIntervalsDuration? : number;
    eyeIntervalsDuration? : number;
    intervalChanges? : number;



    public setDuration() { this.duration = this.endTime - this.startTime };
}
