import { createAction, props } from "@ngrx/store";
import { Screens } from "src/app/enums/screens";


export const changeXPos = createAction(
    'CHANGE_X',
    props<{newx:number}>()
);

export const changeYPos = createAction(
    'CHANGE_Y',
    props<{newy:number}>()
);

export const changeScreen = createAction(
    'CHANGE_SCREEN',
    props<{newScreen:Screens}>()
);
