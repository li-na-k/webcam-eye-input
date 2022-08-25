import { ExpConditionsState } from "./expConditions/expconditions.reducer";
import { EyetrackingState } from "./eyetracking/eyetracking.reducer";

export interface AppState {
    eyetrackingData:EyetrackingState;
    expConditionsData:ExpConditionsState;
}