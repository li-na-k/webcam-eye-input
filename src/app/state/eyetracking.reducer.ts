import { createReducer, on } from "@ngrx/store";
import * as EyetrackingActions from "./eyetracking.action";

export interface EyetrackingState{
    x: number,
    y: number,
    time: number,
    status: "ok" | "error"
}

const initialState : EyetrackingState = {
    x: 0.0, 
    y: 0.0,
    time: 0,
    status: "ok"
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

/*export function eyetrackingReducer(state: EyetrackingState = [initialState], action: EyetrackingActions.Actions){
    switch(action.type){
        case EyetrackingActions.CHANGE_X:
            return [...state, action.payload];
        case EyetrackingActions.CHANGE_Y:
            return [...state, action.payload];
        default: return state;
    }
}*/