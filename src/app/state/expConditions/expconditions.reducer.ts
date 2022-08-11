import { createReducer, on } from "@ngrx/store";
import { Tasks } from "src/app/enums/tasks";
import { InputType } from "src/app/enums/input-type";
import * as ExpConditionsActions from "./expconditions.action";

export interface ExpConditionsState{
    selectedTask : Tasks,
    selectedInputType : InputType
}

const initialState : ExpConditionsState = {
    selectedTask: Tasks.SELECT,
    selectedInputType: InputType.EYE
}

export const expConditionsReducer = createReducer(
    initialState,
    on(ExpConditionsActions.changeInputType, (state, {newInputType}) => {
        return{
            ...state,
            selectedInputType: newInputType
        }
    }),
    on(ExpConditionsActions.changeTask, (state, {newTask}) => {
        return{
            ...state,
            selectedTask: newTask
        }
    })
)