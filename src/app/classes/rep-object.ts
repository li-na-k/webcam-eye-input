import { Positions } from "../enums/positions";
import { Sizes } from "../enums/sizes";

export class RepObject {
    pos : Positions = Positions.POS1;
    mainScreen : boolean = true;
    size : Sizes = Sizes.S;
    numberInBlock : number = 0; 
}
