import { createReducer, on } from "@ngrx/store";
import * as EyetrackingActions from "./eyetracking.action";
import { Screens } from "src/app/enums/screens";

export interface EyetrackingState{
    x: number,
    y: number,
    screen: Screens
}

const initialState : EyetrackingState = {
    x: 0.0, 
    y: 0.0,
    screen: Screens.MAINSCREEN
}

export const eyetrackingReducer = createReducer(
    initialState,
    on(EyetrackingActions.changeXPos, (state, {newx}) => {
        return{
            ...state,
            x: newx
        }
    }),
    on(EyetrackingActions.changeYPos, (state, {newy}) => {
        return{
            ...state,
            y: newy
        }
    }),
    on(EyetrackingActions.changeScreen, (state, {newScreen}) => {
        return{
            ...state,
            screen: newScreen
        }
    })
)