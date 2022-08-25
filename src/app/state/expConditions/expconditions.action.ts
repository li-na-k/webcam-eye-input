import { Injectable } from "@angular/core";
import { Action, createAction, props } from "@ngrx/store";
import { InputType } from "src/app/enums/input-type";
import { Tasks } from "src/app/enums/tasks";


export const changeInputType = createAction(
    'CHANGE_INPUT',
    props<{newInputType:InputType}>()
);

export const changeTask = createAction(
    'CHANGE_TASK',
    props<{newTask:Tasks}>()
);
