import { InputType } from "../enums/input-type";
import { Sizes } from "../enums/sizes";
import { Tasks } from "../enums/tasks";

export class TaskResult {
    inputType : InputType | null = null;
    task : Tasks | null = null;
    size : Sizes | null = null;
    startTime : number = new Date().getTime();
    endTime : number = new Date().getTime();
    get duration() : number{ return this.endTime - this.startTime };
    errors: number = 0;
}
