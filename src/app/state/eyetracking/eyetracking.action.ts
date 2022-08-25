import { Injectable } from "@angular/core";
import { Action, createAction, props } from "@ngrx/store";


export const changeXPos = createAction(
    'CHANGE_X',
    props<{newx:number}>()
);

export const changeYPos = createAction(
    'CHANGE_Y',
    props<{newy:number}>()
);
