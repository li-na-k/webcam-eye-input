import { createSelector } from "@ngrx/store";
import { AppState } from "../app.state";
import { ExpConditionsState } from "./expconditions.reducer";

export const selectExpConditionsState = (state:AppState) => state.expConditionsData;

export const selectInputType = createSelector(
    selectExpConditionsState, (state: ExpConditionsState) => {
        return state.selectedInputType;
    }
)

export const selectTask = createSelector(
    selectExpConditionsState, (state: ExpConditionsState) => {
        return state.selectedTask;
    }
)