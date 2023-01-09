import { createReducer, on } from "@ngrx/store";
import * as EyetrackingActions from "./eyetracking.action";

export interface EyetrackingState{
    x: number,
    y: number
}

const initialState : EyetrackingState = {
    x: 0.0, 
    y: 0.0
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
    })
)