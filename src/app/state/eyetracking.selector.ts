import { createSelector } from "@ngrx/store";
import { AppState } from "./app.state";
import { EyetrackingState } from "./eyetracking.reducer";

export const selectEyetrackingState = (state:AppState) => state.eyetrackingData;

export const selectCurrentEyePos = createSelector(
    selectEyetrackingState, (state: EyetrackingState) => [state.x, state.y]
)